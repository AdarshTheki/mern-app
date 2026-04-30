import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  addAddress,
  deleteAddress,
  getMyAddresses,
  setDefaultAddress,
  updateAddress,
} from '../controllers/address.controller.js';

const router = Router();

router.get('/', verifyJWT(), getMyAddresses);
router.post('/', verifyJWT(), addAddress);
router.patch('/:id', verifyJWT(), updateAddress);
router.delete('/:id', verifyJWT(), deleteAddress);
router.put('/:id/set-default', verifyJWT(), setDefaultAddress);

export { router as addressRouter };
