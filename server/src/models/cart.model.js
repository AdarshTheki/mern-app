import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: { type: Number, default: 1, min: 1 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [cartItemSchema],
});

cartSchema.index({ userId: 1 });

cartSchema.plugin(mongoosePaginate);

export const Cart = mongoose.model('Cart', cartSchema);
