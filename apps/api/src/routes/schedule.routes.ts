import { Router } from 'express';
import { ScheduleController } from '../controllers/schedule.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();
const controller = new ScheduleController();

// All routes require authentication
router.use(authenticate);

// CRUD routes
router.get('/', controller.list);
router.post('/', requireRole(['ADMIN', 'EDITOR']), controller.create);
router.get('/:id', controller.getById);
router.put('/:id', requireRole(['ADMIN', 'EDITOR']), controller.update);
router.delete('/:id', requireRole(['ADMIN', 'EDITOR']), controller.delete);

// Schedule actions
router.post('/:id/run', requireRole(['ADMIN', 'EDITOR']), controller.runNow);
router.post('/:id/pause', requireRole(['ADMIN', 'EDITOR']), controller.pause);
router.post('/:id/resume', requireRole(['ADMIN', 'EDITOR']), controller.resume);
router.get('/:id/history', controller.history);

// Keywords
router.get('/:id/keywords', controller.listKeywords);
router.post('/:id/keywords', requireRole(['ADMIN', 'EDITOR']), controller.addKeywords);
router.delete('/:id/keywords/:keywordId', requireRole(['ADMIN', 'EDITOR']), controller.removeKeyword);
router.post('/:id/keywords/bulk', requireRole(['ADMIN', 'EDITOR']), controller.bulkImportKeywords);

export default router;
