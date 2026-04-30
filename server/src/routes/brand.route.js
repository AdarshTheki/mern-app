import { Router } from 'express';

import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  createBrand,
  deleteBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
} from '../controllers/brand.controller.js';

const router = Router();

router
  .route('/')
  .get(getAllBrands)
  .post(
    verifyJWT(['admin', 'superadmin']),
    upload.single('thumbnail'),
    createBrand
  );

router
  .route('/:id')
  .get(getBrandById)
  .patch(
    verifyJWT(['admin', 'superadmin']),
    upload.single('thumbnail'),
    updateBrand
  )
  .delete(verifyJWT(['admin', 'superadmin']), deleteBrand);

export { router as brandRouter };
