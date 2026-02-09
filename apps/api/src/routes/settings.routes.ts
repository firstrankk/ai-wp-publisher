import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

const router = Router();
const controller = new SettingsController();

// All settings routes require ADMIN role
router.use(authenticate, requireRole(['ADMIN']));

router.get('/cleanup', asyncHandler(controller.getCleanupSettings));
router.put('/cleanup', asyncHandler(controller.updateCleanupSettings));
router.post('/cleanup/run', asyncHandler(controller.runCleanupNow));

export default router;
