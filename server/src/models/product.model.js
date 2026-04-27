import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product title is required'],
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Product vendor is required'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Product brand is required'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'out-of-stock', 'pending'],
      default: 'pending',
    },
    thumbnail: {
      type: String,
      required: [true, 'Product thumbnail is required'],
    },
    images: [
      {
        type: String,
        required: [true, 'Product image is required'],
      },
    ],
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    price: {
      type: Number,
      min: 0,
      default: 0,
    },
    stock: {
      type: Number,
      min: 0,
      default: 0,
    },
    slug: { type: String, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 1, vendorId: 1 });

productSchema.plugin(mongoosePaginate);

productSchema.pre('save', function (next) {
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

export const Product = mongoose.model('Product', productSchema);
