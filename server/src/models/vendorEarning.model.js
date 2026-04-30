import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const vendorEarningSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
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

vendorEarningSchema.index({ vendorId: 1, orderId: 1 });

vendorEarningSchema.plugin(mongoosePaginate);

export const VendorEarning = mongoose.model(
  'VendorEarning',
  vendorEarningSchema
);
