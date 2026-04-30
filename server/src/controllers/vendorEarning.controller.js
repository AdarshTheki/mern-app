import { VendorEarning } from '../models/vendorEarning.model.js';
import { Order } from '../models/order.model.js';
import { OrderItem } from '../models/orderItem.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ─────────────────────────────────────────────
// @desc    Get all earnings for logged-in vendor
// @route   GET /api/vendor/earnings
// @access  Private / Vendor
// ─────────────────────────────────────────────
const getVendorEarnings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10, from, to } = req.query;

  const filter = { vendorId: req.user._id };

  if (status) filter.status = status;

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [earnings, total, totalEarned] = await Promise.all([
    VendorEarning.find(filter)
      .populate('orderId', 'status totalPrice createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    VendorEarning.countDocuments(filter),
    VendorEarning.aggregate([
      { $match: { vendorId: req.user._id, status: 'settled' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((r) => r[0]?.total || 0),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total,
        totalEarned,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        earnings,
      },
      'Vendor earnings fetched successfully'
    )
  );
});

// ─────────────────────────────────────────────
// @desc    Get earning record for a specific order
// @route   GET /api/vendor/earnings/order/:orderId
// @access  Private / Vendor
// ─────────────────────────────────────────────
const getVendorEarningByOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const earning = await VendorEarning.findOne({
    orderId,
    vendorId: req.user._id,
  }).populate('orderId', 'status totalPrice createdAt');

  if (!earning) {
    throw new ApiError(404, 'No earning record found for this order');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, earning, 'Vendor earning fetched successfully'));
});

// ─────────────────────────────────────────────
// @desc    Get vendor dashboard summary stats
// @route   GET /api/vendor/dashboard
// @access  Private / Vendor
// ─────────────────────────────────────────────
const getVendorDashboardStats = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;

  // Orders that contain vendor's products
  const vendorOrderIds = await OrderItem.distinct('orderId', {
    vendorId,
  });

  const [
    totalOrders,
    pendingOrders,
    deliveredOrders,
    cancelledOrders,
    earningStats,
    pendingEarnings,
    recentOrders,
  ] = await Promise.all([
    Order.countDocuments({ _id: { $in: vendorOrderIds } }),

    Order.countDocuments({ _id: { $in: vendorOrderIds }, status: 'pending' }),

    Order.countDocuments({ _id: { $in: vendorOrderIds }, status: 'delivered' }),

    Order.countDocuments({ _id: { $in: vendorOrderIds }, status: 'cancelled' }),

    VendorEarning.aggregate([
      { $match: { vendorId, status: 'settled' } },
      {
        $group: {
          _id: null,
          totalEarned: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]).then((r) => r[0] || { totalEarned: 0, count: 0 }),

    VendorEarning.aggregate([
      { $match: { vendorId, status: 'pending' } },
      { $group: { _id: null, totalPending: { $sum: '$amount' } } },
    ]).then((r) => r[0]?.totalPending || 0),

    Order.find({ _id: { $in: vendorOrderIds } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('status totalPrice createdAt'),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
        earnings: {
          totalEarned: earningStats.totalEarned,
          settledCount: earningStats.count,
          pendingPayout: pendingEarnings,
        },
        recentOrders,
      },
      'Vendor dashboard stats fetched successfully'
    )
  );
});

export { getVendorEarnings, getVendorEarningByOrder, getVendorDashboardStats };
