import { isValidObjectId } from 'mongoose';
import { Category } from '../models/category.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  extractPublicId,
  deleteOnCloudinary,
  uploadOnCloudinary,
} from '../utils/cloudinary.js';

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Public
const getAllCategories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = 'name', name = '' } = req.query;

  const query = { name: { $regex: name, $options: 'i' } };

  const categories = await Category.paginate(query, { page, limit, sort });

  return res
    .status(200)
    .json(
      new ApiResponse(200, categories, 'Categories retrieved successfully')
    );
});
const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid category ID');
  }

  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, category, 'Category retrieved successfully'));
});

// @desc    Create a new category
// @route   POST /api/v1/categories
// @access  Admin
const createCategory = asyncHandler(async (req, res) => {
  const filePath = req?.file?.path;
  const { name, description, depth, path } = req.body;

  if (!name || !filePath || !description) {
    throw new ApiError(400, 'All fields are required');
  }

  const thumbnail = await uploadOnCloudinary(filePath);
  if (!thumbnail) {
    throw new ApiError(500, 'Thumbnail upload failed');
  }

  const category = await Category.create({
    name,
    thumbnail,
    description,
    depth,
    path,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, category, 'Category created successfully'));
});

// @desc    Update a category
// @route   PUT /api/v1/categories/:id
// @access  Admin
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid category ID');
  }

  const { name, description, depth, path } = req.body;
  const filePath = req?.file?.path;

  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  let thumbnail;
  if (filePath) {
    thumbnail = await uploadOnCloudinary(filePath);
    await deleteOnCloudinary(extractPublicId(category.thumbnail));
  }

  category.name = name || category.name;
  category.description = description || category.description;
  category.thumbnail = thumbnail || category.thumbnail;
  category.depth = depth || category.depth;
  category.path = path || category.path;

  await category.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, category, 'Category updated successfully'));
});

// @desc    Delete a category
// @route   DELETE /api/v1/categories/:id
// @access  Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid category ID');
  }

  const category = await Category.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, category, 'Category deleted successfully'));
});

export {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
