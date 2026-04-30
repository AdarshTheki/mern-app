import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const vendorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor user ID is required'],
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

vendorSchema.index({ userId: 1 });

vendorSchema.plugin(mongoosePaginate);

export const Vendor = mongoose.model('Vendor', vendorSchema);
