import { Response } from 'express';
import { notificationsService } from './notifications.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const updatePreferencesSchema = z.object({
  email: z.boolean().optional(),
  inApp: z.boolean().optional(),
  push: z.boolean().optional(),
  taskAssigned: z.boolean().optional(),
  taskDeadline: z.boolean().optional(),
  taskOverdue: z.boolean().optional(),
  campaignUpdate: z.boolean().optional(),
  invoiceSent: z.boolean().optional(),
  invoiceOverdue: z.boolean().optional(),
  paymentReceived: z.boolean().optional(),
});

export class NotificationsController {
  async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const notifications = await notificationsService.getNotifications(req.user.userId, limit);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const count = await notificationsService.getUnreadCount(req.user.userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      await notificationsService.markAsRead(req.params.id, req.user.userId);
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      await notificationsService.markAllAsRead(req.user.userId);
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getPreferences(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const preferences = await notificationsService.getPreferences(req.user.userId);
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async updatePreferences(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = updatePreferencesSchema.parse(req.body);
      await notificationsService.updatePreferences(req.user.userId, validatedData);
      res.json({ message: 'Preferences updated successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      res.status(500).json({ error: (error as Error).message });
    }
  }
}

export const notificationsController = new NotificationsController();

