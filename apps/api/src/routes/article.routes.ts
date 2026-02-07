import { Router } from 'express';
import { ArticleController } from '../controllers/article.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();
const controller = new ArticleController();

// All routes require authentication
router.use(authenticate);

// CRUD routes
router.get('/', controller.list.bind(controller));
router.post('/', requireRole(['ADMIN', 'EDITOR']), controller.create.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.put('/:id', requireRole(['ADMIN', 'EDITOR']), controller.update.bind(controller));
router.delete('/:id', requireRole(['ADMIN', 'EDITOR']), controller.delete.bind(controller));

// Generation & Publishing
router.post('/:id/generate', requireRole(['ADMIN', 'EDITOR']), controller.generate.bind(controller));
router.post('/:id/regenerate', requireRole(['ADMIN', 'EDITOR']), controller.regenerate.bind(controller));
router.post('/:id/generate-image', requireRole(['ADMIN', 'EDITOR']), controller.generateImage.bind(controller));
router.post('/:id/publish', requireRole(['ADMIN', 'EDITOR']), controller.publish.bind(controller));
router.post('/:id/retry', requireRole(['ADMIN', 'EDITOR']), controller.retry.bind(controller));

// Bulk operations
router.post('/bulk-generate', requireRole(['ADMIN', 'EDITOR']), controller.bulkGenerate.bind(controller));

export default router;
