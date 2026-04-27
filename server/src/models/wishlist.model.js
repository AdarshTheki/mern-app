import mongoose from 'mongoose';

const wishlistItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    products: [wishlistItemSchema],
  },
  { timestamps: true }
);

wishlistSchema.index({ userId: 1, createdAt: -1 });

export const Wishlist = mongoose.model('Wishlist', wishlistSchema);
