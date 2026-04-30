import { Address } from '../models/address.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ─────────────────────────────────────────────
// @desc    Add a new address
// @route   POST /api/addresses
// @access  Private
// ─────────────────────────────────────────────
const addAddress = asyncHandler(async (req, res) => {
  const {
    label,
    fullName,
    phone,
    street,
    city,
    state,
    postalCode,
    country,
    isDefault,
  } = req.body;

  if (
    !fullName ||
    !phone ||
    !street ||
    !city ||
    !state ||
    !postalCode ||
    !country
  ) {
    throw new ApiError(400, 'All address fields are required');
  }

  // If new address is default, unset others
  if (isDefault) {
    await Address.updateMany(
      { userId: req.user._id },
      { $set: { isDefault: false } }
    );
  }

  // First address is always default
  const addressCount = await Address.countDocuments({ userId: req.user._id });

  const address = await Address.create({
    userId: req.user._id,
    label,
    fullName,
    phone,
    street,
    city,
    state,
    postalCode,
    country,
    isDefault: isDefault || addressCount === 0,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, address, 'Address added successfully'));
});

// ─────────────────────────────────────────────
// @desc    Update an address
// @route   PUT /api/addresses/:id
// @access  Private
// ─────────────────────────────────────────────
const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findById(req.params.id);
  if (!address) throw new ApiError(404, 'Address not found');

  if (address.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this address');
  }

  const fields = [
    'label',
    'fullName',
    'phone',
    'street',
    'city',
    'state',
    'postalCode',
    'country',
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) address[field] = req.body[field];
  });

  await address.save();

  return res
    .status(200)
    .json(new ApiResponse(200, address, 'Address updated successfully'));
});

// ─────────────────────────────────────────────
// @desc    Delete an address
// @route   DELETE /api/addresses/:id
// @access  Private
// ─────────────────────────────────────────────
const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findById(req.params.id);
  if (!address) throw new ApiError(404, 'Address not found');

  if (address.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to delete this address');
  }

  await address.deleteOne();

  // If deleted address was default, assign default to the most recent remaining
  if (address.isDefault) {
    const next = await Address.findOne({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Address deleted successfully'));
});

// ─────────────────────────────────────────────
// @desc    Get all addresses of logged-in user
// @route   GET /api/addresses
// @access  Private
// ─────────────────────────────────────────────
const getMyAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ userId: req.user._id }).sort({
    isDefault: -1,
    createdAt: -1,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, addresses, 'Addresses fetched successfully'));
});

// ─────────────────────────────────────────────
// @desc    Set an address as the default
// @route   PUT /api/addresses/:id/set-default
// @access  Private
// ─────────────────────────────────────────────
const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await Address.findById(req.params.id);
  if (!address) throw new ApiError(404, 'Address not found');

  if (address.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this address');
  }

  if (address.isDefault) {
    return res
      .status(200)
      .json(new ApiResponse(200, address, 'Address is already the default'));
  }

  // Unset all defaults then set this one
  await Address.updateMany(
    { userId: req.user._id },
    { $set: { isDefault: false } }
  );

  address.isDefault = true;
  await address.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, address, 'Default address updated successfully')
    );
});

export {
  addAddress,
  updateAddress,
  deleteAddress,
  getMyAddresses,
  setDefaultAddress,
};
