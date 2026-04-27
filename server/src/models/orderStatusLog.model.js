import mongoose from 'mongoose';

const orderStatusLogSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    fromStatus: {
      type: String,
      enum: ['pending', 'shipped', 'delivered', 'cancelled'],
      required: true,
    },
    toStatus: {
      type: String,
      enum: ['pending', 'shipped', 'delivered', 'cancelled'],
      required: true,
    },
    note: { type: String },
  },
  { timestamps: true }
);

orderStatusLogSchema.index({ orderId: 1, createdAt: -1 });

export const OrderStatusLog = mongoose.model(
  'OrderStatusLog',
  orderStatusLogSchema
);
