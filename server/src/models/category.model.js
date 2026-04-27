import mongoose, { Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const categorySchema = new Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    slug: { type: String, unique: true },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    description: {
      type: String,
      minlength: 100,
      maxlength: 1000,
      trim: true,
      required: true,
    },
    thumbnail: String,
    depth: { type: Number, default: 0 },
    path: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ name: 1, slug: 1 });
categorySchema.index({ parentId: 1 });

categorySchema.plugin(mongoosePaginate);

categorySchema.pre('save', async function (next) {
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

export const Category = mongoose.model('Category', categorySchema);
