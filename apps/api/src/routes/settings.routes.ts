import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();
const controller = new SettingsController();

// All settings routes require ADMIN role
router.use(authenticate, requireRole(['ADMIN']));

router.get('/cleanup', controller.getCleanupSettings);
router.put('/cleanup', controller.updateCleanupSettings);
router.post('/cleanup/run', controller.runCleanupNow);

export default router;
