import { Router } from 'express';
import {
  getMyNotifications,
  deleteNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../controllers/notification.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifyJWT(), getMyNotifications);
router.put('/read-all', verifyJWT(), markAllNotificationsAsRead);
router.put('/:id/read', verifyJWT(), markNotificationAsRead);
router.delete('/:id', verifyJWT(), deleteNotification);

export { router as notificationRouter };
