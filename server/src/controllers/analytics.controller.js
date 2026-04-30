import { Order } from '../models/order.model.js';
import { OrderItem } from '../models/orderItem.model.js';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';
import { Payment } from '../models/payment.model.js';
import { VendorEarning } from '../models/vendorEarning.model.js';
import { Review } from '../models/review.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

import { subDays, subMonths, subYears } from 'date-fns';
import { Category } from '../models/category.model.js';
import { Brand } from '../models/brand.model.js';

// ─────────────────────────────────────────────
// @desc    Get full admin dashboard summary
// @route   GET /api/analytics/dashboard
// @access  Private / Admin
// ─────────────────────────────────────────────
const getAdminDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();

  // Current month boundaries
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59
  );

  // Today boundaries
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));
  const endOfToday = new Date(now.setHours(23, 59, 59, 999));

  const [
    // ── Totals ──
    totalUsers,
    totalOrders,
    totalProducts,
    totalVendors,

    // ── This month ──
    newUsersThisMonth,
    ordersThisMonth,
    revenueThisMonth,

    // ── Last month (for growth calc) ──
    ordersLastMonth,
    revenueLastMonth,

    // ── Today ──
    ordersToday,
    revenueToday,

    // ── Order status breakdown ──
    orderStatusBreakdown,

    // ── Revenue by payment status ──
    totalRevenue,
    pendingPayouts,

    // ── Recent orders ──
    recentOrders,

    // ── Recent signups ──
    recentUsers,
  ] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Order.countDocuments(),
    Product.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'vendor' }),

    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Payment.aggregate([
      { $match: { status: 'success', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((r) => r[0]?.total || 0),

    Order.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    }),
    Payment.aggregate([
      {
        $match: {
          status: 'success',
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((r) => r[0]?.total || 0),

    Order.countDocuments({
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    }),
    Payment.aggregate([
      {
        $match: {
          status: 'success',
          createdAt: { $gte: startOfToday, $lte: endOfToday },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((r) => r[0]?.total || 0),

    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).then(
      (r) => r.reduce((acc, cur) => ({ ...acc, [cur._id]: cur.count }), {})
    ),

    Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((r) => r[0]?.total || 0),

    VendorEarning.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((r) => r[0]?.total || 0),

    Order.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('status totalPrice createdAt'),

    User.find({ role: 'customer' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt'),
  ]);

  // Growth percentages (avoid division by zero)
  const orderGrowth =
    ordersLastMonth > 0
      ? (((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100).toFixed(
          1
        )
      : null;

  const revenueGrowth =
    revenueLastMonth > 0
      ? (
          ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) *
          100
        ).toFixed(1)
      : null;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        overview: {
          totalUsers,
          totalOrders,
          totalProducts,
          totalVendors,
          totalRevenue,
          pendingPayouts,
        },
        today: {
          orders: ordersToday,
          revenue: revenueToday,
        },
        thisMonth: {
          newUsers: newUsersThisMonth,
          orders: ordersThisMonth,
          revenue: revenueThisMonth,
          orderGrowth: orderGrowth ? `${orderGrowth}%` : 'N/A',
          revenueGrowth: revenueGrowth ? `${revenueGrowth}%` : 'N/A',
        },
        orderStatusBreakdown,
        recentOrders,
        recentUsers,
      },
      'Admin dashboard stats fetched successfully'
    )
  );
});

// ─────────────────────────────────────────────
// @desc    Get sales report grouped by day / month / year
// @route   GET /api/analytics/sales-report
// @access  Private / Admin
// ─────────────────────────────────────────────
const getSalesReport = asyncHandler(async (req, res) => {
  const { groupBy = 'day', from, to } = req.query;

  const allowedGroupBy = ['day', 'month', 'year'];
  if (!allowedGroupBy.includes(groupBy)) {
    throw new ApiError(
      400,
      `groupBy must be one of: ${allowedGroupBy.join(', ')}`
    );
  }

  // Default: last 30 days
  const endDate = to ? new Date(to) : new Date();
  const startDate = from
    ? new Date(from)
    : new Date(new Date().setDate(endDate.getDate() - 30));

  endDate.setHours(23, 59, 59, 999);

  // Build date format for grouping
  const dateFormat =
    groupBy === 'day' ? '%Y-%m-%d' : groupBy === 'month' ? '%Y-%m' : '%Y';

  const [salesData, orderStatusData, paymentMethodData] = await Promise.all([
    // Revenue + order count per period
    Payment.aggregate([
      {
        $match: {
          status: 'success',
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          period: '$_id',
          revenue: 1,
          orderCount: 1,
        },
      },
    ]),

    // Order status distribution in range
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]).then((r) =>
      r.reduce((acc, cur) => ({ ...acc, [cur._id]: cur.count }), {})
    ),

    // Revenue by payment method
    Payment.aggregate([
      {
        $match: {
          status: 'success',
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const totalRevenue = salesData.reduce((acc, cur) => acc + cur.revenue, 0);
  const totalOrders = salesData.reduce((acc, cur) => acc + cur.orderCount, 0);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue:
            totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0,
          from: startDate.toISOString().split('T')[0],
          to: endDate.toISOString().split('T')[0],
          groupBy,
        },
        salesData,
        orderStatusData,
        paymentMethodData,
      },
      'Sales report fetched successfully'
    )
  );
});

// ─────────────────────────────────────────────
// @desc    Get top selling products by quantity sold
// @route   GET /api/analytics/top-products
// @access  Private / Admin
// ─────────────────────────────────────────────
const getTopSellingProducts = asyncHandler(async (req, res) => {
  const { limit = 10, from, to } = req.query;

  const endDate = to ? new Date(to) : new Date();
  const startDate = from
    ? new Date(from)
    : new Date(new Date().setDate(endDate.getDate() - 30));

  endDate.setHours(23, 59, 59, 999);

  // Only count items from delivered orders
  const deliveredOrderIds = await Order.distinct('_id', {
    status: 'delivered',
    createdAt: { $gte: startDate, $lte: endDate },
  });

  const topProducts = await OrderItem.aggregate([
    { $match: { orderId: { $in: deliveredOrderIds } } },
    {
      $group: {
        _id: '$productId',
        totalQuantitySold: { $sum: '$quantity' },
        totalRevenue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalQuantitySold: -1 } },
    { $limit: Number(limit) },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'productId',
        as: 'reviews',
      },
    },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        name: '$product.name',
        image: '$product.image',
        sku: '$product.sku',
        currentStock: '$product.stock',
        totalQuantitySold: 1,
        totalRevenue: 1,
        orderCount: 1,
        avgRating: { $avg: '$reviews.rating' },
        reviewCount: { $size: '$reviews' },
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
        topProducts,
      },
      'Top selling products fetched successfully'
    )
  );
});

/**
 * Returns a date filter based on query string
 */

function getDateFilter(query) {
  const now = new Date();
  switch (query) {
    case 'last-30-days':
      return subDays(now, 30);
    case 'last-3-month':
      return subMonths(now, 3);
    case 'last-6-month':
      return subMonths(now, 6);
    case 'last-year':
      return subYears(now, 1);
    default:
      return subDays(now, 30);
  }
}

/**
 * Calculates total revenue from orders.
 * If `sinceDate` is provided, filters results by createdAt >= sinceDate
 */
async function calculateRevenue(sinceDate = null) {
  const matchStage = sinceDate ? { createdAt: { $gte: sinceDate } } : {};

  const revenuePipeline = [
    { $match: matchStage },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.productId',
        foreignField: '_id',
        as: 'productInfo',
      },
    },
    { $unwind: '$productInfo' },
    {
      $project: {
        amount: { $multiply: ['$items.quantity', '$productInfo.price'] },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
      },
    },
  ];

  const result = await Order.aggregate(revenuePipeline);
  return result[0]?.totalRevenue || 0;
}

// @desc    Get dashboard totals
// @route   GET /api/v1/dashboard/totals
// @access  Admin
const getTotals = asyncHandler(async (req, res) => {
  const now = new Date();
  const dateFilter = getDateFilter(req.query?.date);

  // Count users, products, and orders
  const [
    totalUsers,
    usersSinceDate,
    totalProducts,
    productsSinceDate,
    totalOrders,
    ordersSinceDate,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: dateFilter } }),
    Product.countDocuments(),
    Product.countDocuments({ createdAt: { $gte: dateFilter } }),
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: dateFilter } }),
  ]);

  // Calculate revenues
  const totalRevenue = await calculateRevenue();
  const revenueSinceDate = await calculateRevenue(dateFilter);

  const totals = {
    totalUsers,
    lastMonthUser: usersSinceDate,
    totalProducts,
    lastMonthProduct: productsSinceDate,
    totalOrders,
    lastMonthOrder: ordersSinceDate,
    totalRevenues: totalRevenue,
    lastMonthRevenue: revenueSinceDate,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, totals, 'Dashboard totals retrieved successfully')
    );
});

// @desc    Get dashboard orders chart
// @route   GET /api/v1/dashboard/orders-chart
// @access  Admin
const getOrdersChart = asyncHandler(async (req, res) => {
  const ordersChart = await Order.aggregate([
    {
      $unwind: '$items',
    },
    {
      $lookup: {
        from: 'products',
        localField: 'items.productId',
        foreignField: '_id',
        as: 'items.product',
      },
    },
    {
      $unwind: {
        path: '$items.product',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        itemTotal: {
          $multiply: ['$items.quantity', '$items.product.price'],
        },
      },
    },
    {
      $group: {
        _id: '$_id',
        customer: { $first: '$customer' },
        status: { $first: '$status' },
        totalPrice: { $sum: '$itemTotal' },
        createdAt: { $first: '$createdAt' },
        updatedAt: { $first: '$updatedAt' },
      },
    },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, ordersChart, 'get orders char successfully'));
});

const getDownloadData = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  let data;

  switch (slug) {
    case 'order':
      data = await Order.find().sort({ createdAt: 1 }).exec();
      break;
    case 'category':
      data = await Category.find().sort({ createdAt: 1 }).exec();
      break;
    case 'brand':
      data = await Brand.find().sort({ createdAt: 1 }).exec();
      break;
    case 'product':
      data = await Product.find().sort({ createdAt: 1 }).exec();
      break;
    default:
      throw new ApiError(404, 'Invalid param, please check the endpoints');
  }

  res
    .status(200)
    .json(new ApiResponse(200, data, `get download data to ${slug}`));
});

export {
  getAdminDashboardStats,
  getSalesReport,
  getTopSellingProducts,
  getTotals,
  getOrdersChart,
  getDownloadData,
};
