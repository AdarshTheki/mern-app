import { AccountDetail } from '../models/accountDetail.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ─────────────────────────────────────────────
// @desc    Add a bank / payment account
// @route   POST /api/account-details
// @access  Private / Vendor
// ─────────────────────────────────────────────
const addAccountDetails = asyncHandler(async (req, res) => {
  const {
    accountHolderName,
    accountNumber,
    bankName,
    ifscCode,
    accountType,
    isPrimary,
  } = req.body;

  if (
    !accountHolderName ||
    !accountNumber ||
    !bankName ||
    !ifscCode ||
    !accountType
  ) {
    throw new ApiError(400, 'All account fields are required');
  }

  const duplicate = await AccountDetail.findOne({
    userId: req.user._id,
    accountNumber,
  });
  if (duplicate)
    throw new ApiError(400, 'This account number is already added');

  if (isPrimary) {
    await AccountDetail.updateMany(
      { userId: req.user._id },
      { $set: { isPrimary: false } }
    );
  }

  const accountCount = await AccountDetail.countDocuments({
    userId: req.user._id,
  });

  const account = await AccountDetail.create({
    userId: req.user._id,
    accountHolderName,
    accountNumber,
    bankName,
    ifscCode,
    accountType,
    isPrimary: isPrimary || accountCount === 0,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, account, 'Account details added successfully'));
});

// ─────────────────────────────────────────────
// @desc    Update an account
// @route   PUT /api/account-details/:id
// @access  Private / Vendor
// ─────────────────────────────────────────────
const updateAccountDetails = asyncHandler(async (req, res) => {
  const account = await AccountDetail.findById(req.params.id);
  if (!account) throw new ApiError(404, 'Account not found');

  if (account.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this account');
  }

  const fields = ['accountHolderName', 'bankName', 'ifscCode', 'accountType'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) account[field] = req.body[field];
  });

  await account.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, account, 'Account details updated successfully')
    );
});

// ─────────────────────────────────────────────
// @desc    Delete an account
// @route   DELETE /api/account-details/:id
// @access  Private / Vendor
// ─────────────────────────────────────────────
const deleteAccountDetails = asyncHandler(async (req, res) => {
  const account = await AccountDetail.findById(req.params.id);
  if (!account) throw new ApiError(404, 'Account not found');

  if (account.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to delete this account');
  }

  await account.deleteOne();

  // Re-assign primary if deleted account was primary
  if (account.isPrimary) {
    const next = await AccountDetail.findOne({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    if (next) {
      next.isPrimary = true;
      await next.save();
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Account details deleted successfully'));
});

// ─────────────────────────────────────────────
// @desc    Get all accounts for logged-in user
// @route   GET /api/account-details
// @access  Private / Vendor
// ─────────────────────────────────────────────
const getMyAccountDetails = asyncHandler(async (req, res) => {
  const accounts = await AccountDetail.find({ userId: req.user._id }).sort({
    isPrimary: -1,
    createdAt: -1,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, accounts, 'Account details fetched successfully')
    );
});

// ─────────────────────────────────────────────
// @desc    Set an account as primary
// @route   PUT /api/account-details/:id/set-primary
// @access  Private / Vendor
// ─────────────────────────────────────────────
const setPrimaryAccount = asyncHandler(async (req, res) => {
  const account = await AccountDetail.findById(req.params.id);
  if (!account) throw new ApiError(404, 'Account not found');

  if (account.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this account');
  }

  if (account.isPrimary) {
    return res
      .status(200)
      .json(new ApiResponse(200, account, 'Account is already set as primary'));
  }

  await AccountDetail.updateMany(
    { userId: req.user._id },
    { $set: { isPrimary: false } }
  );

  account.isPrimary = true;
  await account.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, account, 'Primary account updated successfully')
    );
});

export {
  addAccountDetails,
  updateAccountDetails,
  deleteAccountDetails,
  getMyAccountDetails,
  setPrimaryAccount,
};
