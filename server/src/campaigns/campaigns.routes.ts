import { Router } from 'express';
import { campaignsController } from './campaigns.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requirePermission } from '../rbac/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission('campaigns', 'read'),
  campaignsController.getCampaigns.bind(campaignsController)
);

router.get(
  '/:id',
  requirePermission('campaigns', 'read'),
  campaignsController.getCampaignById.bind(campaignsController)
);

router.post(
  '/',
  requirePermission('campaigns', 'create'),
  campaignsController.createCampaign.bind(campaignsController)
);

router.put(
  '/:id',
  requirePermission('campaigns', 'update'),
  campaignsController.updateCampaign.bind(campaignsController)
);

router.put(
  '/:id/status',
  requirePermission('campaigns', 'update'),
  campaignsController.updateStatus.bind(campaignsController)
);

router.put(
  '/:id/kpi',
  requirePermission('campaigns', 'update'),
  campaignsController.updateKPI.bind(campaignsController)
);

router.delete(
  '/:id',
  requirePermission('campaigns', 'delete'),
  campaignsController.deleteCampaign.bind(campaignsController)
);

router.get(
  '/:id/metrics',
  requirePermission('campaigns', 'read'),
  campaignsController.getCampaignMetrics.bind(campaignsController)
);

export default router;

