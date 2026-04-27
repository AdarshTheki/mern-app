import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const inventoryLogSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    changeType: {
      type: String,
      enum: ['addition', 'removal', 'adjustment'],
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    reason: { type: String, required: true },
  },
  { timestamps: true }
);

inventoryLogSchema.index({ productId: 1, createdAt: -1 });

inventoryLogSchema.plugin(mongoosePaginate);

export const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);
