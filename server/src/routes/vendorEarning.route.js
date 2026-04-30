import { Router } from 'express';
import {
  getVendorDashboardStats,
  getVendorEarningByOrder,
  getVendorEarnings,
} from '../controllers/vendorEarning.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT(['vendor']));

router.get('/dashboard', getVendorDashboardStats);
router.get('/earnings', getVendorEarnings);
router.get('/earnings/order/:orderId', getVendorEarningByOrder);

export { router as vendorEarningRouter };
