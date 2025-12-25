import { Router } from 'express';
import { invoicesController } from './invoices.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../rbac/rbac.middleware';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission('invoices', 'read'),
  invoicesController.getInvoices.bind(invoicesController)
);

router.get(
  '/overdue',
  requirePermission('invoices', 'read'),
  invoicesController.getOverdueInvoices.bind(invoicesController)
);

router.get(
  '/:id',
  requirePermission('invoices', 'read'),
  invoicesController.getInvoiceById.bind(invoicesController)
);

router.post(
  '/',
  requirePermission('invoices', 'create'),
  invoicesController.createInvoice.bind(invoicesController)
);

router.put(
  '/:id',
  requirePermission('invoices', 'update'),
  invoicesController.updateInvoice.bind(invoicesController)
);

router.put(
  '/:id/payment-status',
  requirePermission('invoices', 'update'),
  invoicesController.updatePaymentStatus.bind(invoicesController)
);

router.post(
  '/:id/send',
  requirePermission('invoices', 'update'),
  invoicesController.sendInvoice.bind(invoicesController)
);

router.delete(
  '/:id',
  requirePermission('invoices', 'delete'),
  invoicesController.deleteInvoice.bind(invoicesController)
);

export default router;

