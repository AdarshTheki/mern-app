import { Router } from 'express';
import {
  getPaymentByOrder,
  initiatePayment,
  refundPayment,
  verifyPayment,
} from '../controllers/payment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/initiate', verifyJWT(), initiatePayment);
router.post('/verify', verifyJWT(), verifyPayment);
router.get('/order/:orderId', verifyJWT(), getPaymentByOrder);
router.post('/:id/refund', verifyJWT(['admin']), refundPayment);

export { router as paymentRouter };
