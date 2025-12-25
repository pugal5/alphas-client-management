import { Router } from 'express';
import { filesController, uploadMiddleware } from './files.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../rbac/rbac.middleware';

const router = Router();

router.use(authenticate);

router.post(
  '/upload',
  requirePermission('clients', 'read'), // Basic permission check
  uploadMiddleware,
  filesController.uploadFile.bind(filesController)
);

router.get(
  '/',
  requirePermission('clients', 'read'),
  filesController.getFiles.bind(filesController)
);

router.get(
  '/:id',
  requirePermission('clients', 'read'),
  filesController.getFileById.bind(filesController)
);

router.get(
  '/:id/download',
  requirePermission('clients', 'read'),
  filesController.downloadFile.bind(filesController)
);

router.delete(
  '/:id',
  requirePermission('clients', 'delete'),
  filesController.deleteFile.bind(filesController)
);

export default router;

