import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  createVendor,
  getAllVendors,
  getMyVendor,
  getVendorById,
  toggleVendorStatus,
  updateVendor,
} from '../controllers/vendor.controller.js';

const router = Router();

router.post('/vendors', verifyJWT(), createVendor);
router.get('/vendors/me', verifyJWT(['vendor']), getMyVendor);
router.put('/vendors/me', verifyJWT(['vendor']), updateVendor);
router.get('/vendors', verifyJWT(['admin']), getAllVendors);
router.get('/vendors/:id', getVendorById); // 🔓
router.patch(
  '/vendors/:id/toggle-status',
  verifyJWT(['admin']),
  toggleVendorStatus
);

export { router as vendorRouter };
