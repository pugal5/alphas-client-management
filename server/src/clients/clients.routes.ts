import { Router } from 'express';
import { clientsController } from './clients.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../rbac/rbac.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get(
  '/',
  requirePermission('clients', 'read'),
  clientsController.getClients.bind(clientsController)
);

router.get(
  '/:id',
  requirePermission('clients', 'read'),
  clientsController.getClientById.bind(clientsController)
);

router.post(
  '/',
  requirePermission('clients', 'create'),
  clientsController.createClient.bind(clientsController)
);

router.put(
  '/:id',
  requirePermission('clients', 'update'),
  clientsController.updateClient.bind(clientsController)
);

router.delete(
  '/:id',
  requirePermission('clients', 'delete'),
  clientsController.deleteClient.bind(clientsController)
);

router.post(
  '/:id/contacts',
  requirePermission('clients', 'update'),
  clientsController.addContact.bind(clientsController)
);

router.put(
  '/contacts/:contactId',
  requirePermission('clients', 'update'),
  clientsController.updateContact.bind(clientsController)
);

router.delete(
  '/contacts/:contactId',
  requirePermission('clients', 'update'),
  clientsController.deleteContact.bind(clientsController)
);

router.get(
  '/:id/metrics',
  requirePermission('clients', 'read'),
  clientsController.getClientMetrics.bind(clientsController)
);

export default router;

