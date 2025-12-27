import { Response } from 'express';
import { analyticsService } from './analytics.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export class AnalyticsController {
  async getCampaignROI(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        clientId: req.query.clientId as string | undefined,
        campaignId: req.query.campaignId as string | undefined,
      };

      const data = await analyticsService.getCampaignROI(filters, req.user.userId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getTeamUtilization(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        userId: req.query.userId as string | undefined,
      };

      const data = await analyticsService.getTeamUtilization(filters, req.user.userId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getTaskOnTimePercentage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const data = await analyticsService.getTaskOnTimePercentage(filters, req.user.userId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getClientProfitability(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const filters = {
        clientId: req.query.clientId as string | undefined,
      };

      const data = await analyticsService.getClientProfitability(filters, req.user.userId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getBudgetAccuracy(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const data = await analyticsService.getBudgetAccuracy(filters, req.user.userId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getDashboardMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const data = await analyticsService.getDashboardMetrics(req.user.userId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}

export const analyticsController = new AnalyticsController();

