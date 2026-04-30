import { Router } from 'express';

import { uploadImage } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree,
} from '../controllers/category.controller.js';

const router = Router();

router
  .route('/')
  .get(getAllCategories)
  .post(
    uploadImage.single('thumbnail'),
    verifyJWT(['admin', 'seller']),
    createCategory
  );

router.route('/tree').get(getCategoryTree);

router
  .route('/:id')
  .get(getCategoryById)
  .patch(
    verifyJWT(['admin', 'seller']),
    uploadImage.single('thumbnail'),
    updateCategory
  )
  .delete(verifyJWT(['admin']), deleteCategory);

export { router as categoryRouter };
