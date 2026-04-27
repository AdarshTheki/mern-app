import mongoosePaginate from 'mongoose-paginate-v2';
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      required: [true, 'Email is required'],
    },
    loginType: {
      type: String,
      enum: ['email_password', 'github', 'google'],
      default: 'email_password',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'superadmin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    phone: Number,
    isEmailVerified: { type: Boolean, default: false },
    avatar: { type: String, default: 'https://avatar.iran.liara.run/public' }, // cloudinary url
    refreshToken: String,
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
    emailVerificationToken: String,
    emailVerificationExpiry: Date,
    storageUsed: { type: Number, default: 0 },
    storageLimit: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.index({ email: 1, createdAt: -1 });

userSchema.plugin(mongoosePaginate);

// Pre-save middleware to hash the password before saving it to the database
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare the provided password with the stored hashed password
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Method to generate an access token on short time for the user
userSchema.methods.generateAccessToken = function () {
  return jwt.sign({ _id: this._id }, process.env.SECRET_TOKEN, {
    expiresIn: '7d',
  });
};

// Method to generate a refresh token on long time for the user
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.SECRET_TOKEN, {
    expiresIn: '30d',
  });
};

//  Method responsible for generating tokens for email verification, password reset etc.
userSchema.methods.generateTemporaryToken = () => {
  const unHashedToken = crypto.randomBytes(20).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(unHashedToken)
    .digest('hex');
  const tokenExpiry = Date.now() + 20 * 60 * 1000; // 20 minutes
  return { hashedToken, tokenExpiry, unHashedToken };
};

export const User = mongoose.model('User', userSchema);
