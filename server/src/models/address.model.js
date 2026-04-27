import mongoose, { Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const addressSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  line1: { type: String, required: true },
  line2: String,
  city: { type: String, required: true },
  landmark: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, required: true },
  phone: {
    type: Number,
    required: true,
    min: 1000000000,
    max: 9999999999,
  },
});

addressSchema.plugin(mongoosePaginate);

addressSchema.index({ userId: 1 });

export const Address = mongoose.model('Address', addressSchema);
