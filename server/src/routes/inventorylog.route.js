import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  getLowStockProducts,
  adjustInventory,
  getInventoryLogsByProduct,
} from '../controllers/inventoryLog.controller.js';

const router = Router();

router.get('/low-stock', verifyJWT(['admin']), getLowStockProducts);
router.post('/adjust', verifyJWT(['admin', 'vendor']), adjustInventory); // Admin + Vendor
router.get('/product/:productId', verifyJWT(), getInventoryLogsByProduct);

export { router as inventoryLogsRouter };
