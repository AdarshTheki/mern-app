import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const venderEarningSchema = new mongoose.Schema(
  {
    venderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vender',
      required: [true, 'Vendor ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required'],
    },
    netAmount: {
      type: Number,
      required: [true, 'Net amount is required'],
    },
    commission: {
      type: Number,
      required: [true, 'Commission is required'],
    },
  },
  { timestamps: true }
);

venderEarningSchema.index({ venderId: 1, orderId: 1 });

venderEarningSchema.plugin(mongoosePaginate);

export const VenderEarning = mongoose.model(
  'VenderEarning',
  venderEarningSchema
);
