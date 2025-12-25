import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../rbac/rbac.middleware';

const router = Router();

router.use(authenticate);
router.use(requirePermission('analytics', 'read'));

router.get('/campaign-roi', analyticsController.getCampaignROI.bind(analyticsController));
router.get('/team-utilization', analyticsController.getTeamUtilization.bind(analyticsController));
router.get('/task-on-time', analyticsController.getTaskOnTimePercentage.bind(analyticsController));
router.get('/client-profitability', analyticsController.getClientProfitability.bind(analyticsController));
router.get('/budget-accuracy', analyticsController.getBudgetAccuracy.bind(analyticsController));
router.get('/dashboard', analyticsController.getDashboardMetrics.bind(analyticsController));

export default router;

