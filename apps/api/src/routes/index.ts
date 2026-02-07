import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import siteRoutes from './site.routes.js';
import articleRoutes from './article.routes.js';
import scheduleRoutes from './schedule.routes.js';
import apiKeyRoutes from './api-key.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/sites', siteRoutes);
router.use('/articles', articleRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/api-keys', apiKeyRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
