import { Router } from 'express';
import { SiteController } from '../controllers/site.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();
const controller = new SiteController();

// All routes require authentication
router.use(authenticate);

// CRUD routes
router.get('/', controller.list);
router.post('/', requireRole(['ADMIN', 'EDITOR']), controller.create);
router.get('/:id', controller.getById);
router.put('/:id', requireRole(['ADMIN', 'EDITOR']), controller.update);
router.delete('/:id', requireRole(['ADMIN']), controller.delete);

// Special actions
router.post('/:id/test', requireRole(['ADMIN', 'EDITOR']), controller.testConnection);
router.get('/:id/categories', controller.getCategories);
router.post('/bulk-import', requireRole(['ADMIN']), controller.bulkImport);
router.get('/export/csv', requireRole(['ADMIN']), controller.exportCsv);

// Site groups
router.get('/groups/list', controller.listGroups);
router.post('/groups', requireRole(['ADMIN']), controller.createGroup);
router.put('/groups/:groupId', requireRole(['ADMIN']), controller.updateGroup);
router.delete('/groups/:groupId', requireRole(['ADMIN']), controller.deleteGroup);

export default router;
