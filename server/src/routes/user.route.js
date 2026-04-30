import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
import {
  // admin
  getAllUsers,
  getUserById,
  deleteUser,
  updateUserRole,

  // login user
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  verifyEmail,
  resendEmailVerification,
  changePassword,
  resetPassword,
  forgotPassword,
  getCurrentUser,
  updateUserProfile,
  deactivateAccount,
  handleSocialLogin,
} from '../controllers/user.controller.js';
import passport from 'passport';

const router = Router();

// SOS - Social login routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
  (_, res) => res.send('redirecting to google...')
);

router.get(
  '/github',
  passport.authenticate('github', { scope: ['profile', 'email'] }),
  (_, res) => res.send('redirecting to github...')
);

router
  .route('/google/callback')
  .get(passport.authenticate('google'), handleSocialLogin);

router
  .route('/github/callback')
  .get(passport.authenticate('github'), handleSocialLogin);

// User Permissions
router.route('/admin').get(verifyJWT(['admin']), getAllUsers);
router.route('/admin/role/:userId').post(verifyJWT(['admin'], updateUserRole));
router
  .route('/admin/:id')
  .get(verifyJWT(['admin']), getUserById)
  .delete(verifyJWT(['admin']), deleteUser);

router.post('/refresh-token', refreshAccessToken);
router.post('/reset-password/:resetToken', resetPassword);
router.post('/forgot-password', forgotPassword);
router.get('/resend-email-verification', verifyJWT(), resendEmailVerification);
router.get('/verify-email/:verificationToken', verifyEmail);
router.post('/change-password', verifyJWT(), changePassword);

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', verifyJWT(), logoutUser);

router.get('/', verifyJWT(), getCurrentUser);
router.delete('/', verifyJWT(), deactivateAccount);
router.patch('/', verifyJWT(), upload.single('avatar'), updateUserProfile);

export { router as userRouter };
