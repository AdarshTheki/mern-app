import { Vendor } from '../models/vendor.model.js';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ─────────────────────────────────────────────
// @desc    Create a vendor profile for the logged-in user
// @route   POST /api/vendors
// @access  Private
// ─────────────────────────────────────────────
const createVendor = asyncHandler(async (req, res) => {
  const {
    businessName,
    businessEmail,
    businessPhone,
    businessAddress,
    description,
    logo,
    category,
    gstNumber,
  } = req.body;

  if (!businessName || !businessEmail || !businessPhone || !businessAddress) {
    throw new ApiError(
      400,
      'businessName, businessEmail, businessPhone, and businessAddress are required'
    );
  }

  // One vendor profile per user
  const existing = await Vendor.findOne({ userId: req.user._id });
  if (existing) {
    throw new ApiError(400, 'You already have a vendor profile');
  }

  // Check business email uniqueness
  const emailTaken = await Vendor.findOne({ businessEmail });
  if (emailTaken) {
    throw new ApiError(400, 'A vendor with this business email already exists');
  }

  const vendor = await Vendor.create({
    userId: req.user._id,
    businessName,
    businessEmail,
    businessPhone,
    businessAddress,
    description,
    logo,
    category,
    gstNumber,
    isActive: false, // Requires admin approval
    isVerified: false,
  });

  // Elevate user role to vendor
  await User.findByIdAndUpdate(req.user._id, { role: 'vendor' });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        vendor,
        'Vendor profile created successfully. Awaiting admin approval.'
      )
    );
});

// ─────────────────────────────────────────────
// @desc    Get logged-in vendor's own profile
// @route   GET /api/vendors/me
// @access  Private / Vendor
// ─────────────────────────────────────────────
const getMyVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id }).populate(
    'userId',
    'name email avatar'
  );

  if (!vendor) {
    throw new ApiError(
      404,
      'Vendor profile not found. Please create one first.'
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, vendor, 'Vendor profile fetched successfully'));
});

// ─────────────────────────────────────────────
// @desc    Update logged-in vendor's profile
// @route   PUT /api/vendors/me
// @access  Private / Vendor
// ─────────────────────────────────────────────
const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id });

  if (!vendor) {
    throw new ApiError(404, 'Vendor profile not found');
  }

  // Prevent updating sensitive/immutable fields
  const restrictedFields = ['userId', 'isActive', 'isVerified', 'createdAt'];
  restrictedFields.forEach((field) => delete req.body[field]);

  // Check new business email uniqueness if being changed
  if (
    req.body.businessEmail &&
    req.body.businessEmail !== vendor.businessEmail
  ) {
    const emailTaken = await Vendor.findOne({
      businessEmail: req.body.businessEmail,
    });
    if (emailTaken) {
      throw new ApiError(
        400,
        'A vendor with this business email already exists'
      );
    }
  }

  const updatableFields = [
    'businessName',
    'businessEmail',
    'businessPhone',
    'businessAddress',
    'description',
    'logo',
    'category',
    'gstNumber',
  ];

  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) vendor[field] = req.body[field];
  });

  await vendor.save();

  return res
    .status(200)
    .json(new ApiResponse(200, vendor, 'Vendor profile updated successfully'));
});

// ─────────────────────────────────────────────
// @desc    Get a vendor's public profile by ID
// @route   GET /api/vendors/:id
// @access  Public
// ─────────────────────────────────────────────
const getVendorById = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id)
    .populate('userId', 'name avatar')
    .select('-gstNumber'); // Hide sensitive info from public

  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  if (!vendor.isActive) {
    throw new ApiError(403, 'This vendor profile is currently inactive');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, vendor, 'Vendor fetched successfully'));
});

// ─────────────────────────────────────────────
// @desc    Get all vendors with filters and pagination
// @route   GET /api/vendors
// @access  Private / Admin
// ─────────────────────────────────────────────
const getAllVendors = asyncHandler(async (req, res) => {
  const {
    isActive,
    isVerified,
    category,
    search,
    page = 1,
    limit = 10,
  } = req.query;

  const filter = {};

  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
  if (category) filter.category = category;

  // Search by business name or email
  if (search) {
    filter.$or = [
      { businessName: { $regex: search, $options: 'i' } },
      { businessEmail: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [vendors, total] = await Promise.all([
    Vendor.find(filter)
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Vendor.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        vendors,
      },
      'Vendors fetched successfully'
    )
  );
});

// ─────────────────────────────────────────────
// @desc    Toggle vendor active / inactive status
// @route   PATCH /api/vendors/:id/toggle-status
// @access  Private / Admin
// ─────────────────────────────────────────────
const toggleVendorStatus = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);

  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  vendor.isActive = !vendor.isActive;

  // Also mark as verified when activating for the first time
  if (vendor.isActive && !vendor.isVerified) {
    vendor.isVerified = true;
  }

  await vendor.save();

  const statusLabel = vendor.isActive ? 'activated' : 'deactivated';

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        vendorId: vendor._id,
        isActive: vendor.isActive,
        isVerified: vendor.isVerified,
      },
      `Vendor ${statusLabel} successfully`
    )
  );
});

export {
  createVendor,
  getMyVendor,
  updateVendor,
  getVendorById,
  getAllVendors,
  toggleVendorStatus,
};
