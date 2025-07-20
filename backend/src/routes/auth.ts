import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getProfile,
  requestPasswordReset,
  validateRegister,
  validateLogin,
  validatePasswordReset,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/password-reset', validatePasswordReset, requestPasswordReset);

// Protected routes
router.get('/profile', authenticateToken, getProfile);

export default router;