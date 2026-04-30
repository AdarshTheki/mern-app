import { Router } from 'express';
import {
  cancelOrder,
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  getOrderItemsByOrder,
  updateOrderStatus,
  getOrderStatusLogs,
} from '../controllers/order.controller.js';

import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// orders
router.post('/', verifyJWT(), createOrder);
router.get('/my-orders', verifyJWT(), getMyOrders);
router.get('/:id', verifyJWT(), getOrderById);
router.put('/:id/cancel', verifyJWT(), cancelOrder);
router.get('', verifyJWT(['admin']), getAllOrders);
router.put('/:id/status', verifyJWT(['admin']), updateOrderStatus);

// order items
router.get('/:orderId/items', verifyJWT(), getOrderItemsByOrder);

// order status logs
router.get('/:orderId/status-logs', verifyJWT(), getOrderStatusLogs);

export { router as orderRouter };
