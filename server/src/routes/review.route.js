import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  createReview,
  deleteReview,
  getMyReviews,
  getReviewsByProduct,
  updateReview,
} from '../controllers/review.controller.js';

const router = Router();

router.post('/', verifyJWT(), createReview);
router.put('/:id', verifyJWT(), updateReview);
router.delete('/:id', verifyJWT(), deleteReview);
router.get('/product/:productId', getReviewsByProduct); // 🔓
router.get('/my-reviews', verifyJWT(), getMyReviews);

export { router as reviewRouter };
