import { Product } from '../models/product.model.js';
import { InventoryLog } from '../models/inventoryLog.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ─────────────────────────────────────────────
// @desc    Get all inventory logs for a product
// @route   GET /api/inventory/product/:productId
// @access  Private / Admin / Vendor
// ─────────────────────────────────────────────
const getInventoryLogsByProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  // Vendor can only see their own product logs
  if (
    req.user.role === 'vendor' &&
    product.vendorId.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, 'You are not authorized to view these logs');
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    InventoryLog.find({ productId })
      .populate('adjustedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    InventoryLog.countDocuments({ productId }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        logs,
      },
      'Inventory logs fetched successfully'
    )
  );
});

// ─────────────────────────────────────────────
// @desc    Manually adjust stock for a product
// @route   POST /api/inventory/adjust
// @access  Private / Admin / Vendor
// ─────────────────────────────────────────────
const adjustInventory = asyncHandler(async (req, res) => {
  const { productId, adjustment, reason } = req.body;
  // adjustment: positive = restock, negative = deduction

  if (!productId || adjustment === undefined || !reason) {
    throw new ApiError(400, 'productId, adjustment, and reason are required');
  }

  if (typeof adjustment !== 'number' || adjustment === 0) {
    throw new ApiError(400, 'Adjustment must be a non-zero number');
  }

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  if (
    req.user.role === 'vendor' &&
    product.vendorId.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(
      403,
      "You are not authorized to adjust this product's inventory"
    );
  }

  const previousStock = product.stock;
  const newStock = previousStock + adjustment;

  if (newStock < 0) {
    throw new ApiError(
      400,
      `Insufficient stock. Current stock: ${previousStock}`
    );
  }

  product.stock = newStock;
  await product.save();

  const log = await InventoryLog.create({
    productId,
    adjustedBy: req.user._id,
    adjustment,
    previousStock,
    newStock,
    reason,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { product, log }, 'Inventory adjusted successfully')
    );
});

// ─────────────────────────────────────────────
// @desc    Get products with low stock (below threshold)
// @route   GET /api/inventory/low-stock
// @access  Private / Admin / Vendor
// ─────────────────────────────────────────────
const getLowStockProducts = asyncHandler(async (req, res) => {
  const { threshold = 10, page = 1, limit = 10 } = req.query;

  const filter = { stock: { $lte: Number(threshold) } };

  // Vendor sees only their own products
  if (req.user.role === 'vendor') {
    filter.vendorId = req.user._id;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select('name image stock sku')
      .sort({ stock: 1 })
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        threshold: Number(threshold),
        products,
      },
      'Low stock products fetched successfully'
    )
  );
});

export { getInventoryLogsByProduct, adjustInventory, getLowStockProducts };
