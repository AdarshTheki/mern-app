import { isValidObjectId } from 'mongoose';
import { Brand } from '../models/brand.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  deleteOnCloudinary,
  uploadOnCloudinary,
  extractPublicId,
} from '../utils/cloudinary.js';

// @desc    Get all brands
// @route   GET /api/v1/brands
// @access  Public
export const getAllBrands = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = '-name', name = '' } = req.query;

  const query = { name: { $regex: name, $options: 'i' }, isActive: true };

  const brands = await Brand.paginate(query, { page, limit, sort });

  return res
    .status(200)
    .json(new ApiResponse(200, brands, 'Brands retrieved successfully'));
});

// @desc    Get brand by ID
// @route   GET /api/v1/brands/:id
// @access  Public
export const getBrandById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid brand ID');
  }

  const brand = await Brand.findById(id);
  if (!brand) {
    throw new ApiError(404, 'Brand not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, brand, 'Brand retrieved successfully'));
});

// @desc    Create a new brand
// @route   POST /api/v1/brands
// @access  Admin
export const createBrand = asyncHandler(async (req, res) => {
  const filePath = req?.file?.path;
  const { name, description } = req.body;

  let fields = [];
  if (!name) fields.push('name');
  if (!description) fields.push('description');
  if (!filePath) fields.push('thumbnail');

  if (fields.length > 0) {
    throw new ApiError(400, `${fields.join(', ')} are required`);
  }

  const thumbnail = await uploadOnCloudinary(filePath);

  const brand = await Brand.create({
    name,
    thumbnail,
    description,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, brand, 'Brand created successfully'));
});

// @desc    Update a brand
// @route   PUT /api/v1/brands/:id
// @access  Admin
export const updateBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid brand ID');
  }

  const { name, description } = req.body;
  const filePath = req?.file?.path;

  const brand = await Brand.findById(id);
  if (!brand) {
    throw new ApiError(404, 'Brand not found');
  }

  let thumbnail;
  if (filePath) {
    thumbnail = await uploadOnCloudinary(filePath);
    await deleteOnCloudinary(extractPublicId(brand.thumbnail));
  }

  brand.name = name || brand.name;
  brand.description = description || brand.description;
  brand.thumbnail = thumbnail || brand.thumbnail;

  await brand.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, brand, 'Brand updated successfully'));
});

// @desc    Delete a brand
// @route   DELETE /api/v1/brands/:id
// @access  Admin
export const deleteBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid brand ID');
  }

  const brand = await Brand.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!brand) {
    throw new ApiError(404, 'Brand not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, brand, 'Brand deleted successfully'));
});
