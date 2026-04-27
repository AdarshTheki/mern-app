import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} from '../controllers/wishlist.controller.js';

const router = Router();

router.route('/').get(verifyJWT(), getWishlist);
router.route('/').post(verifyJWT(), addToWishlist);
router.route('/').delete(verifyJWT(), removeFromWishlist);
router.route('/clear').delete(verifyJWT(), clearWishlist);

export default router;
