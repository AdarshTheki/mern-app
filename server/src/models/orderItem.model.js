import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const orderItemSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: { type: Number, default: 1, min: 1 },
  unitPrice: { type: Number, required: true },
});

orderItemSchema.index({ orderId: 1 });

orderItemSchema.plugin(mongoosePaginate);

export const OrderItem = mongoose.model('OrderItem', orderItemSchema);
