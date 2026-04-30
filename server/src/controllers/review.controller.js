import { Review } from '../models/review.model.js';
import { Order } from '../models/order.model.js';
import { OrderItem } from '../models/orderItem.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ─────────────────────────────────────────────
// @desc    Create a review for a purchased product
// @route   POST /api/reviews
// @access  Private
// ─────────────────────────────────────────────
const createReview = asyncHandler(async (req, res) => {
  const { productId, orderId, rating, comment } = req.body;

  if (!productId || !orderId || !rating) {
    throw new ApiError(400, 'productId, orderId, and rating are required');
  }

  if (rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be between 1 and 5');
  }

  // Verify the order belongs to the user and is delivered
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      'You can only review products from your own orders'
    );
  }

  if (order.status !== 'delivered') {
    throw new ApiError(
      400,
      'You can only review products after the order is delivered'
    );
  }

  // Verify the product was part of the order
  const item = await OrderItem.findOne({ orderId, productId });
  if (!item) {
    throw new ApiError(400, 'This product was not part of the specified order');
  }

  // Prevent duplicate reviews
  const existing = await Review.findOne({
    userId: req.user._id,
    productId,
    orderId,
  });
  if (existing) {
    throw new ApiError(
      400,
      'You have already reviewed this product for this order'
    );
  }

  const review = await Review.create({
    userId: req.user._id,
    productId,
    orderId,
    rating,
    comment,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, review, 'Review submitted successfully'));
});

// ─────────────────────────────────────────────
// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
// ─────────────────────────────────────────────
const updateReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');

  if (review.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this review');
  }

  if (rating !== undefined) {
    if (rating < 1 || rating > 5)
      throw new ApiError(400, 'Rating must be between 1 and 5');
    review.rating = rating;
  }

  if (comment !== undefined) review.comment = comment;

  await review.save();

  return res
    .status(200)
    .json(new ApiResponse(200, review, 'Review updated successfully'));
});

// ─────────────────────────────────────────────
// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
// ─────────────────────────────────────────────
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');

  if (
    review.userId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new ApiError(403, 'You are not authorized to delete this review');
  }

  await review.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Review deleted successfully'));
});

// ─────────────────────────────────────────────
// @desc    Get all reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
// ─────────────────────────────────────────────
const getReviewsByProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total] = await Promise.all([
    Review.find({ productId })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments({ productId }),
  ]);

  const avgRating =
    total > 0
      ? await Review.aggregate([
          { $match: { productId: reviews[0]?.productId } },
          { $group: { _id: null, avg: { $avg: '$rating' } } },
        ]).then((r) => r[0]?.avg?.toFixed(1) || 0)
      : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        avgRating,
        reviews,
      },
      'Product reviews fetched successfully'
    )
  );
});

// ─────────────────────────────────────────────
// @desc    Get all reviews by logged-in user
// @route   GET /api/reviews/my-reviews
// @access  Private
// ─────────────────────────────────────────────
const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ userId: req.user._id })
    .populate('productId', 'name image')
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, reviews, 'Your reviews fetched successfully'));
});

export {
  createReview,
  updateReview,
  deleteReview,
  getReviewsByProduct,
  getMyReviews,
};
