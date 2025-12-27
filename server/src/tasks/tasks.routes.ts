import { Router } from 'express';
import { tasksController } from './tasks.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../rbac/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission('tasks', 'read'),
  tasksController.getTasks.bind(tasksController)
);

router.get(
  '/gantt',
  requirePermission('tasks', 'read'),
  tasksController.getGanttData.bind(tasksController)
);

router.get(
  '/:id',
  requirePermission('tasks', 'read'),
  tasksController.getTaskById.bind(tasksController)
);

router.post(
  '/',
  requirePermission('tasks', 'create'),
  tasksController.createTask.bind(tasksController)
);

router.put(
  '/:id',
  requirePermission('tasks', 'update'),
  tasksController.updateTask.bind(tasksController)
);

router.put(
  '/:id/status',
  requirePermission('tasks', 'update'),
  tasksController.updateStatus.bind(tasksController)
);

router.put(
  '/:id/time-tracking',
  requirePermission('tasks', 'update'),
  tasksController.updateTimeTracking.bind(tasksController)
);

router.delete(
  '/:id',
  requirePermission('tasks', 'delete'),
  tasksController.deleteTask.bind(tasksController)
);

router.post(
  '/:id/dependencies',
  requirePermission('tasks', 'update'),
  tasksController.addDependency.bind(tasksController)
);

router.delete(
  '/:id/dependencies/:dependsOnId',
  requirePermission('tasks', 'update'),
  tasksController.removeDependency.bind(tasksController)
);

export default router;

