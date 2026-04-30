import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';

import {
  getAdminDashboardStats,
  getSalesReport,
  getTopSellingProducts,
  getTotals,
  getOrdersChart,
  getDownloadData,
} from '../controllers/analytics.controller.js';

const router = Router();

router.get('/totals', getTotals);
router.get('/orders-chart', getOrdersChart);
router.get('/download/:slug', getDownloadData);

router.use(verifyJWT(['admin']));
router.get('/dashboard', getAdminDashboardStats);
router.get('/sales-report', getSalesReport);
router.get('/top-products', getTopSellingProducts);

export { router as analyticRouter };
