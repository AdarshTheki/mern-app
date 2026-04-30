import { Order } from '../models/order.model.js';
import { OrderItem } from '../models/orderItem.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { OrderStatusLog } from '../models/orderStatusLog.model.js';

// ─────────────────────────────────────────────
// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
// ─────────────────────────────────────────────
const createOrder = asyncHandler(async (req, res) => {
  const { items, addressId } = req.body;
  // items: [{ productId, quantity, unitPrice }]

  if (!items || items.length === 0) {
    throw new ApiError(400, 'No order items provided');
  }

  if (!addressId) {
    throw new ApiError(400, 'Delivery address is required');
  }

  // Calculate total price from items
  const totalPrice = items.reduce((acc, item) => {
    if (!item.productId || !item.quantity || !item.unitPrice) {
      throw new ApiError(
        400,
        'Each item must have productId, quantity, and unitPrice'
      );
    }
    return acc + item.quantity * item.unitPrice;
  }, 0);

  // Create the parent order first
  const order = await Order.create({
    userId: req.user._id,
    addressId,
    totalPrice,
    status: 'pending',
  });

  // Bulk-insert order items linked to the order
  const orderItems = await OrderItem.insertMany(
    items.map((item) => ({
      orderId: order._id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }))
  );

  return res
    .status(201)
    .json(
      new ApiResponse(201, { order, orderItems }, 'Order created successfully')
    );
});

// ─────────────────────────────────────────────
// @desc    Get logged-in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
// ─────────────────────────────────────────────
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({
    createdAt: -1,
  });

  if (!orders || orders.length === 0) {
    throw new ApiError(404, 'No orders found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, orders, 'Orders fetched successfully'));
});

// ─────────────────────────────────────────────
// @desc    Get a single order by ID with its items
// @route   GET /api/orders/:id
// @access  Private
// ─────────────────────────────────────────────
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Allow only the owner or an admin
  if (
    order.userId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You are not authorized to view this order');
  }

  const orderItems = await OrderItem.find({ orderId: order._id }).populate(
    'productId',
    'name image price'
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, { order, orderItems }, 'Order fetched successfully')
    );
});

// ─────────────────────────────────────────────
// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
// ─────────────────────────────────────────────
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Only the owner or admin can cancel
  if (
    order.userId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You are not authorized to cancel this order');
  }

  const nonCancellableStatuses = ['shipped', 'delivered', 'cancelled'];
  if (nonCancellableStatuses.includes(order.status)) {
    throw new ApiError(
      400,
      `Order cannot be cancelled — current status: "${order.status}"`
    );
  }

  order.status = 'cancelled';
  await order.save();

  return res
    .status(200)
    .json(new ApiResponse(200, order, 'Order cancelled successfully'));
});

// ─────────────────────────────────────────────
// @desc    Get all orders — with optional status filter & pagination
// @route   GET /api/orders
// @access  Private / Admin
// ─────────────────────────────────────────────
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('userId', 'name email')
      .populate('addressId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        orders,
      },
      'All orders fetched successfully'
    )
  );
});

// ─────────────────────────────────────────────
// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private / Admin
// ─────────────────────────────────────────────
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const allowedStatuses = [
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ];

  if (!status) {
    throw new ApiError(400, 'Status is required');
  }

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(
      400,
      `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`
    );
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.status === 'cancelled') {
    throw new ApiError(400, 'Cannot update a cancelled order');
  }

  if (order.status === 'delivered') {
    throw new ApiError(400, 'Cannot update an already delivered order');
  }

  order.status = status;
  await order.save();

  return res
    .status(200)
    .json(new ApiResponse(200, order, `Order status updated to "${status}"`));
});

// ─────────────────────────────────────────────
// @desc    Get all items belonging to an order
// @route   GET /api/orders/:orderId/items
// @access  Private
// ─────────────────────────────────────────────
const getOrderItemsByOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  if (
    order.userId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin' &&
    req.user.role !== 'vendor'
  ) {
    throw new ApiError(403, 'You are not authorized to view these items');
  }

  const items = await OrderItem.find({ orderId }).populate(
    'productId',
    'name image price'
  );

  return res
    .status(200)
    .json(new ApiResponse(200, items, 'Order items fetched successfully'));
});

// ─────────────────────────────────────────────
// @desc    Get all status change logs for an order
// @route   GET /api/orders/:orderId/status-logs
// @access  Private
// ─────────────────────────────────────────────
const getOrderStatusLogs = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  if (
    order.userId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You are not authorized to view these logs');
  }

  const logs = await OrderStatusLog.find({ orderId })
    .populate('changedBy', 'name email role')
    .sort({ createdAt: 1 }); // chronological order

  return res
    .status(200)
    .json(new ApiResponse(200, logs, 'Order status logs fetched successfully'));
});

export {
  // orders
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,

  // order items
  getOrderItemsByOrder,

  // order status log
  getOrderStatusLogs,
};
