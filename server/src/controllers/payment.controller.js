import { Payment } from '../models/payment.model.js';
import { Order } from '../models/order.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ─────────────────────────────────────────────
// @desc    Initiate a payment for an order
// @route   POST /api/payments/initiate
// @access  Private
// ─────────────────────────────────────────────
const initiatePayment = asyncHandler(async (req, res) => {
  const { orderId, paymentMethod } = req.body;

  if (!orderId || !paymentMethod) {
    throw new ApiError(400, 'orderId and paymentMethod are required');
  }

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to pay for this order');
  }

  if (order.status === 'cancelled') {
    throw new ApiError(400, 'Cannot initiate payment for a cancelled order');
  }

  const existingPayment = await Payment.findOne({ orderId, status: 'success' });
  if (existingPayment) {
    throw new ApiError(400, 'This order has already been paid');
  }

  const payment = await Payment.create({
    orderId,
    userId: req.user._id,
    amount: order.totalPrice,
    paymentMethod,
    status: 'pending',
  });

  // TODO: Integrate payment gateway (Razorpay / Stripe) and attach gateway response

  return res
    .status(201)
    .json(new ApiResponse(201, payment, 'Payment initiated successfully'));
});

// ─────────────────────────────────────────────
// @desc    Verify / confirm a payment (webhook or manual)
// @route   POST /api/payments/verify
// @access  Private
// ─────────────────────────────────────────────
const verifyPayment = asyncHandler(async (req, res) => {
  const { paymentId, gatewayPaymentId, gatewaySignature } = req.body;

  if (!paymentId) throw new ApiError(400, 'paymentId is required');

  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(404, 'Payment not found');

  if (payment.status === 'success') {
    throw new ApiError(400, 'Payment is already verified');
  }

  // TODO: Verify signature with payment gateway SDK
  // e.g. razorpay.validateWebhookSignature(...)

  payment.status = 'success';
  payment.gatewayPaymentId = gatewayPaymentId;
  payment.gatewaySignature = gatewaySignature;
  payment.paidAt = new Date();
  await payment.save();

  // Update order status to processing after successful payment
  await Order.findByIdAndUpdate(payment.orderId, { status: 'processing' });

  return res
    .status(200)
    .json(new ApiResponse(200, payment, 'Payment verified successfully'));
});

// ─────────────────────────────────────────────
// @desc    Get payment details for an order
// @route   GET /api/payments/order/:orderId
// @access  Private
// ─────────────────────────────────────────────
const getPaymentByOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  if (
    order.userId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You are not authorized to view this payment');
  }

  const payment = await Payment.findOne({ orderId });
  if (!payment) throw new ApiError(404, 'No payment found for this order');

  return res
    .status(200)
    .json(new ApiResponse(200, payment, 'Payment fetched successfully'));
});

// ─────────────────────────────────────────────
// @desc    Refund a payment
// @route   POST /api/payments/:id/refund
// @access  Private / Admin
// ─────────────────────────────────────────────
const refundPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, 'Payment not found');

  if (payment.status !== 'success') {
    throw new ApiError(400, 'Only successful payments can be refunded');
  }

  if (payment.status === 'refunded') {
    throw new ApiError(400, 'Payment has already been refunded');
  }

  // TODO: Call payment gateway refund API
  // e.g. razorpay.payments.refund(payment.gatewayPaymentId, { amount })

  payment.status = 'refunded';
  payment.refundedAt = new Date();
  await payment.save();

  await Order.findByIdAndUpdate(payment.orderId, { status: 'cancelled' });

  return res
    .status(200)
    .json(new ApiResponse(200, payment, 'Payment refunded successfully'));
});

export { initiatePayment, verifyPayment, getPaymentByOrder, refundPayment };
