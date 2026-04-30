import { Delivery } from '../models/delivery.model.js';
import { Order } from '../models/order.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ─────────────────────────────────────────────
// @desc    Assign a delivery agent to an order
// @route   POST /api/deliveries/assign
// @access  Private / Admin
// ─────────────────────────────────────────────
const assignDelivery = asyncHandler(async (req, res) => {
  const { orderId, deliveryAgentId, estimatedDeliveryDate } = req.body;

  if (!orderId || !deliveryAgentId) {
    throw new ApiError(400, 'orderId and deliveryAgentId are required');
  }

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.status === 'cancelled') {
    throw new ApiError(400, 'Cannot assign delivery for a cancelled order');
  }

  const existingDelivery = await Delivery.findOne({ orderId });
  if (existingDelivery) {
    throw new ApiError(400, 'Delivery is already assigned for this order');
  }

  const delivery = await Delivery.create({
    orderId,
    deliveryAgentId,
    estimatedDeliveryDate: estimatedDeliveryDate || null,
    status: 'assigned',
  });

  await Order.findByIdAndUpdate(orderId, { status: 'shipped' });

  return res
    .status(201)
    .json(new ApiResponse(201, delivery, 'Delivery assigned successfully'));
});

// ─────────────────────────────────────────────
// @desc    Get delivery details for an order
// @route   GET /api/deliveries/order/:orderId
// @access  Private
// ─────────────────────────────────────────────
const getDeliveryByOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  if (
    order.userId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You are not authorized to view this delivery');
  }

  const delivery = await Delivery.findOne({ orderId }).populate(
    'deliveryAgentId',
    'name phone'
  );

  if (!delivery)
    throw new ApiError(404, 'No delivery record found for this order');

  return res
    .status(200)
    .json(
      new ApiResponse(200, delivery, 'Delivery details fetched successfully')
    );
});

// ─────────────────────────────────────────────
// @desc    Update delivery status
// @route   PUT /api/deliveries/:id/status
// @access  Private / Admin / DeliveryAgent
// ─────────────────────────────────────────────
const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const allowedStatuses = [
    'assigned',
    'out_for_delivery',
    'delivered',
    'failed',
  ];

  if (!status) throw new ApiError(400, 'Status is required');

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(
      400,
      `Invalid status. Allowed: ${allowedStatuses.join(', ')}`
    );
  }

  const delivery = await Delivery.findById(req.params.id);
  if (!delivery) throw new ApiError(404, 'Delivery not found');

  if (delivery.status === 'delivered') {
    throw new ApiError(400, 'Delivery is already marked as delivered');
  }

  delivery.status = status;
  if (status === 'delivered') {
    delivery.deliveredAt = new Date();
    await Order.findByIdAndUpdate(delivery.orderId, { status: 'delivered' });
  }

  await delivery.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, delivery, `Delivery status updated to "${status}"`)
    );
});

export { assignDelivery, getDeliveryByOrder, updateDeliveryStatus };
