import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const controller = new AuthController();

// Public routes
router.post('/register', controller.register);
router.post('/login', controller.login);

// Protected routes
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.me);
router.put('/password', authenticate, controller.changePassword);

export default router;
