import { Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const paymentSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    transactionId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    method: {
      type: String,
      enum: ['credit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

paymentSchema.index({ orderId: 1 });

paymentSchema.plugin(mongoosePaginate);

export const Payment = mongoose.model('Payment', paymentSchema);
