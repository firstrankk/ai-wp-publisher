import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();
const controller = new UserController();

// All routes require authentication
router.use(authenticate);

// Admin only routes
router.get('/', requireRole(['ADMIN']), controller.list);
router.post('/', requireRole(['ADMIN']), controller.create);
router.get('/:id', requireRole(['ADMIN']), controller.getById);
router.put('/:id', requireRole(['ADMIN']), controller.update);
router.delete('/:id', requireRole(['ADMIN']), controller.delete);
router.put('/:id/sites', requireRole(['ADMIN']), controller.assignSites);

export default router;
