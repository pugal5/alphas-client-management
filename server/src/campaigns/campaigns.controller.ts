import { Response } from 'express';
import { campaignsService } from './campaigns.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';
import { CampaignStatus, CampaignType } from '@prisma/client';

const createCampaignSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().min(1),
  type: z.nativeEnum(CampaignType),
  status: z.nativeEnum(CampaignStatus).optional(),
  description: z.string().optional(),
  budget: z.number().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  kpiTarget: z.string().optional(),
  notes: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
});

const updateCampaignSchema = createCampaignSchema.partial();

const updateStatusSchema = z.object({
  status: z.nativeEnum(CampaignStatus),
});

const updateKPISchema = z.record(z.number());

export class CampaignsController {
  async getCampaigns(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const filters = {
        status: req.query.status as CampaignStatus | undefined,
        clientId: req.query.clientId as string | undefined,
        type: req.query.type as CampaignType | undefined,
        assignedToId: req.query.assignedToId as string | undefined,
        createdById: req.query.createdById as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        search: req.query.search as string | undefined,
        skip: req.query.skip ? parseInt(req.query.skip as string) : undefined,
        take: req.query.take ? parseInt(req.query.take as string) : undefined,
      };

      const result = await campaignsService.getCampaigns(filters, req.user.userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getCampaignById(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const campaign = await campaignsService.getCampaignById(req.params.id, req.user.userId);
      res.json(campaign);
    } catch (error) {
      if ((error as Error).message === 'Campaign not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(403).json({ error: (error as Error).message });
    }
  }

  async createCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = createCampaignSchema.parse(req.body);
      const campaign = await campaignsService.createCampaign(
        {
          ...validatedData,
          startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
          endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        },
        req.user.userId
      );
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async updateCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = updateCampaignSchema.parse(req.body);
      const campaign = await campaignsService.updateCampaign(
        req.params.id,
        {
          ...validatedData,
          startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
          endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        },
        req.user.userId
      );
      res.json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { status } = updateStatusSchema.parse(req.body);
      const campaign = await campaignsService.updateCampaignStatus(req.params.id, status, req.user.userId);
      res.json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async updateKPI(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const kpiData = updateKPISchema.parse(req.body);
      const campaign = await campaignsService.updateKPI(req.params.id, kpiData, req.user.userId);
      res.json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async deleteCampaign(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      await campaignsService.deleteCampaign(req.params.id, req.user.userId);
      res.json({ message: 'Campaign deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async getCampaignMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const metrics = await campaignsService.getCampaignMetrics(req.params.id, req.user.userId);
      res.json(metrics);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export const campaignsController = new CampaignsController();

