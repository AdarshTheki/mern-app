import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const accountDetailSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accountHolderName: { type: String, required: true },
    accountType: { type: String, required: true },
    accountNumber: { type: Number, required: true },
    bankName: { type: String, required: true },
    ifscCode: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

accountDetailSchema.index({ userId: 1 });

accountDetailSchema.plugin(mongoosePaginate);

export const AccountDetail = mongoose.model(
  'AccountDetail',
  accountDetailSchema
);
