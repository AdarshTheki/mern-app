import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required'],
  },
  comment: { type: String, required: [true, 'Comment is required'] },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    required: [true, 'Rating is required and must be between 0 and 5'],
  },
  createdAt: { type: Date, default: Date.now },
});

reviewSchema.index({ productId: 1, userId: 1 });

reviewSchema.plugin(mongoosePaginate);

export const Review = mongoose.model('Review', reviewSchema);
