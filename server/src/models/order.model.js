import mongoose, { Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const orderSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
    },
    totalPrice: { type: Number, required: true },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });

orderSchema.plugin(mongoosePaginate);

export const Order = mongoose.model('Order', orderSchema);
