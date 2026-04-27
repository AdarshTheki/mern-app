import mongoose, { Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const deliverySchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    agentName: { type: String, required: true },
    agentPhone: { type: String, required: true },
    trackCode: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'in_transit', 'delivered', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

deliverySchema.index({ orderId: 1 });

deliverySchema.plugin(mongoosePaginate);

export const Delivery = mongoose.model('Delivery', deliverySchema);
