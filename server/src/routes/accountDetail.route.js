import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  addAccountDetails,
  deleteAccountDetails,
  getMyAccountDetails,
  setPrimaryAccount,
  updateAccountDetails,
} from '../controllers/accountDetail.controller.js';

const router = Router();

router.use(verifyJWT(['vendor']));

router.post('/', addAccountDetails);
router.get('/', getMyAccountDetails);
router.patch('/:id', updateAccountDetails);
router.delete('/:id', deleteAccountDetails);
router.put('/:id/set-primary', setPrimaryAccount);

export { router as accountDetailsRouter };
