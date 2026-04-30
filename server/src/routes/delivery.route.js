import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  assignDelivery,
  getDeliveryByOrder,
  updateDeliveryStatus,
} from '../controllers/delivery.controller.js';

const router = Router();

router.post('/assign', verifyJWT(['admin']), assignDelivery);
router.get('/order/:orderId', verifyJWT(), getDeliveryByOrder);
router.put('/:id/status', verifyJWT(['admin']), updateDeliveryStatus);

export { router as deliveryRouter };
