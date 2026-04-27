import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { Wishlist } from '../models/wishlist.model.js';

const getWishlist = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
  const userId = req.user._id;
  const wishlist = await Wishlist.paginate(
    { userId },
    { page, limit, sort },
    'products.productId'
  );
  if (!wishlist) {
    throw new ApiError(404, 'Wishlist not found');
  }
  res
    .status(200)
    .json(new ApiResponse(200, wishlist, 'Wishlist retrieved successfully'));
});

const addToWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.body;

  const updatedWishlist = await Wishlist.findOneAndUpdate(
    { userId },
    { $addToSet: { products: { productId } } },
    { new: true, upsert: true }
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedWishlist,
        'Product added to wishlist successfully'
      )
    );
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;

  const updatedWishlist = await Wishlist.findOneAndUpdate(
    { userId },
    { $pull: { products: { productId } } },
    { new: true }
  );

  if (!updatedWishlist) {
    throw new ApiError(404, 'Wishlist not found');
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedWishlist,
        'Product removed from wishlist successfully'
      )
    );
});

const clearWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const updatedWishlist = await Wishlist.findOneAndUpdate(
    { userId },
    { $set: { products: [] } },
    { new: true }
  );

  if (!updatedWishlist) {
    throw new ApiError(404, 'Wishlist not found');
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedWishlist, 'Wishlist cleared successfully')
    );
});

export { getWishlist, addToWishlist, removeFromWishlist, clearWishlist };
