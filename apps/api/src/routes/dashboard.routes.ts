import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const controller = new DashboardController();

// All routes require authentication
router.use(authenticate);

// Dashboard routes
router.get('/stats', controller.getStats);
router.get('/recent-activity', controller.getRecentActivity);
router.get('/reports/posts', controller.getPostsReport);
router.get('/reports/errors', controller.getErrorsReport);
router.get('/reports/api-usage', controller.getApiUsageReport);

export default router;
