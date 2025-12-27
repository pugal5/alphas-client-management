import { Router } from 'express';
import { notificationsController } from './notifications.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', notificationsController.getNotifications.bind(notificationsController));
router.get('/unread-count', notificationsController.getUnreadCount.bind(notificationsController));
router.put('/:id/read', notificationsController.markAsRead.bind(notificationsController));
router.put('/read-all', notificationsController.markAllAsRead.bind(notificationsController));
router.get('/preferences', notificationsController.getPreferences.bind(notificationsController));
router.put('/preferences', notificationsController.updatePreferences.bind(notificationsController));

export default router;

