import { Router } from 'express';
import { ApiKeyController } from '../controllers/api-key.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();
const controller = new ApiKeyController();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireRole(['ADMIN']));

// CRUD routes
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

// Test connection
router.post('/:id/test', controller.test);

// Set as default for AI generation
router.post('/:id/set-default', controller.setDefault);

export default router;
