import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    title: { type: String },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

notificationSchema.plugin(mongoosePaginate);

export const Notification = mongoose.model('Notification', notificationSchema);
