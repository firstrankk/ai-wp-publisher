import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const controller = new AuthController();

// Stricter rate limit for auth endpoints (5 requests per 15 min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { error: 'Too many attempts, please try again later.' },
});

// Public routes
router.post('/register', authLimiter, controller.register);
router.post('/login', authLimiter, controller.login);

// Protected routes
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.me);
router.put('/password', authenticate, controller.changePassword);

export default router;
