import { Router } from 'express';
import { uploadImage } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getAllProducts, // (search with filters)
  getProductsByVendor,
  toggleProductActive,
} from '../controllers/product.controller.js';

const router = Router();

const uploadFields = uploadImage.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'images', maxCount: 5 },
]);

router
  .route('/')
  .get(getAllProducts)
  .post(uploadFields, verifyJWT(['admin', 'superadmin']), createProduct);

router
  .route('/:productId')
  .get(getProductById)
  .patch(uploadFields, verifyJWT(['admin', 'superadmin']), updateProduct)
  .delete(verifyJWT(['admin', 'superadmin']), deleteProduct);

router
  .route('/:productId/status')
  .patch(verifyJWT(['admin', 'superadmin']), toggleProductActive);

router.route('/vendor/:vendorId').get(getProductsByVendor);

export default router;
