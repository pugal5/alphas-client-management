import { Campaign, CampaignStatus, CampaignType, Prisma } from '@prisma/client';
import { campaignsRepository, CampaignFilters, CampaignWithRelations } from './campaigns.repository.js';
import { prisma } from '../lib/prisma.js';
import { rbacService } from '../rbac/rbac.service.js';
import { webSocketService } from '../websocket/websocket.service.js';

export interface CreateCampaignData {
  clientId: string;
  name: string;
  type: CampaignType;
  status?: CampaignStatus;
  description?: string;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
  kpiTarget?: string;
  notes?: string;
  assignedToId?: string;
}

export interface UpdateCampaignData extends Partial<CreateCampaignData> {}

const statusWorkflow: Record<CampaignStatus, CampaignStatus[]> = {
  planning: ['active', 'cancelled'],
  active: ['paused', 'completed', 'cancelled'],
  paused: ['active', 'completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export class CampaignsService {
  async getCampaigns(filters: CampaignFilters, userId: string): Promise<{ campaigns: CampaignWithRelations[]; total: number }> {
    const hasAccess = await rbacService.checkPermission(userId, 'campaigns', 'read');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Filter by assignment if not admin/manager
    if (user?.role !== 'admin' && user?.role !== 'manager') {
      filters.assignedToId = userId;
    }

    return campaignsRepository.findMany(filters);
  }

  async getCampaignById(id: string, userId: string): Promise<CampaignWithRelations> {
    const campaign = await campaignsRepository.findById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const hasAccess = await rbacService.checkResourceAccess(userId, 'campaigns', id, 'read');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    return campaign;
  }

  async createCampaign(data: CreateCampaignData, userId: string): Promise<Campaign> {
    const hasAccess = await rbacService.checkPermission(userId, 'campaigns', 'create');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const campaign = await campaignsRepository.create({
      name: data.name,
      type: data.type,
      status: data.status || 'planning',
      description: data.description,
      budget: data.budget ? new Prisma.Decimal(data.budget) : null,
      startDate: data.startDate,
      endDate: data.endDate,
      kpiTarget: data.kpiTarget,
      kpiActual: '{}',
      notes: data.notes,
      client: {
        connect: { id: data.clientId },
      },
      creator: {
        connect: { id: userId },
      },
      assignedTo: data.assignedToId ? {
        connect: { id: data.assignedToId },
      } : undefined,
    });

    const activity = await prisma.activity.create({
      data: {
        type: 'campaign_created',
        title: `Campaign created: ${campaign.name}`,
        userId,
        clientId: data.clientId,
        campaignId: campaign.id,
      },
    });

    // Emit WebSocket event
    webSocketService.emitCampaignUpdated(campaign.id, { campaign });
    webSocketService.emitActivityAdded(activity);

    return campaign;
  }

  async updateCampaign(id: string, data: UpdateCampaignData, userId: string): Promise<Campaign> {
    const hasAccess = await rbacService.checkResourceAccess(userId, 'campaigns', id, 'update');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const updateData: Prisma.CampaignUpdateInput = {};
    if (data.name) updateData.name = data.name;
    if (data.type) updateData.type = data.type;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.budget !== undefined) updateData.budget = new Prisma.Decimal(data.budget);
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.kpiTarget !== undefined) updateData.kpiTarget = data.kpiTarget;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.assignedToId !== undefined) {
      updateData.assignedTo = data.assignedToId ? { connect: { id: data.assignedToId } } : { disconnect: true };
    }

    const campaign = await campaignsRepository.update(id, updateData);

    await prisma.activity.create({
      data: {
        type: 'campaign_updated',
        title: `Campaign updated: ${campaign.name}`,
        userId,
        campaignId: campaign.id,
      },
    });

    return campaign;
  }

  async updateCampaignStatus(id: string, status: CampaignStatus, userId: string): Promise<Campaign> {
    const campaign = await campaignsRepository.findById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const hasAccess = await rbacService.checkResourceAccess(userId, 'campaigns', id, 'update');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    // Validate status transition
    const allowedStatuses = statusWorkflow[campaign.status];
    if (allowedStatuses.length > 0 && !allowedStatuses.includes(status)) {
      throw new Error(`Cannot transition from ${campaign.status} to ${status}`);
    }

    const updatedCampaign = await campaignsRepository.updateStatus(id, status);

    await prisma.activity.create({
      data: {
        type: 'campaign_updated',
        title: `Campaign status changed: ${campaign.name} -> ${status}`,
        userId,
        campaignId: campaign.id,
        metadata: {
          oldStatus: campaign.status,
          newStatus: status,
        },
      },
    });

    return updatedCampaign;
  }

  async updateKPI(campaignId: string, kpiData: Record<string, number>, userId: string): Promise<Campaign> {
    const hasAccess = await rbacService.checkResourceAccess(userId, 'campaigns', campaignId, 'update');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { kpiActual: true },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    let currentKpi: Record<string, number> = {};
    try {
      currentKpi = campaign.kpiActual ? JSON.parse(campaign.kpiActual) : {};
    } catch (error) {
      // Invalid JSON, start fresh
    }

    const updatedKpi = { ...currentKpi, ...kpiData };

    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        kpiActual: JSON.stringify(updatedKpi),
      },
    });

    return updatedCampaign;
  }

  async deleteCampaign(id: string, userId: string): Promise<void> {
    const hasAccess = await rbacService.checkResourceAccess(userId, 'campaigns', id, 'delete');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    await campaignsRepository.softDelete(id);

    await prisma.activity.create({
      data: {
        type: 'campaign_updated',
        title: `Campaign cancelled`,
        userId,
        campaignId: id,
      },
    });
  }

  async getCampaignMetrics(campaignId: string, userId: string): Promise<ReturnType<typeof campaignsRepository.getMetrics>> {
    const hasAccess = await rbacService.checkResourceAccess(userId, 'campaigns', campaignId, 'read');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    return campaignsRepository.getMetrics(campaignId);
  }
}

export const campaignsService = new CampaignsService();

