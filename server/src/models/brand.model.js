import mongoose, { Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const brandSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnail: String,
    description: {
      type: String,
      trim: true,
      required: true,
    },
    slug: { type: String, unique: true },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

brandSchema.index({ name: 1, slug: 1 });

brandSchema.plugin(mongoosePaginate);

brandSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

export const Brand = mongoose.model('Brand', brandSchema);
