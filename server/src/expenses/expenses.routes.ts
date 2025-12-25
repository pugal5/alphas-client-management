import { Router } from 'express';
import { expensesController } from './expenses.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../rbac/rbac.middleware';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission('expenses', 'read'),
  expensesController.getExpenses.bind(expensesController)
);

router.get(
  '/:id',
  requirePermission('expenses', 'read'),
  expensesController.getExpenseById.bind(expensesController)
);

router.post(
  '/',
  requirePermission('expenses', 'create'),
  expensesController.createExpense.bind(expensesController)
);

router.put(
  '/:id',
  requirePermission('expenses', 'update'),
  expensesController.updateExpense.bind(expensesController)
);

router.post(
  '/:id/approve',
  requirePermission('expenses', 'update'),
  expensesController.approveExpense.bind(expensesController)
);

router.post(
  '/:id/reject',
  requirePermission('expenses', 'update'),
  expensesController.rejectExpense.bind(expensesController)
);

router.delete(
  '/:id',
  requirePermission('expenses', 'delete'),
  expensesController.deleteExpense.bind(expensesController)
);

export default router;

