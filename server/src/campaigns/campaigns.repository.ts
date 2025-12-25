import { Prisma, Campaign, CampaignStatus, CampaignType } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface CampaignFilters {
  status?: CampaignStatus;
  clientId?: string;
  type?: CampaignType;
  assignedToId?: string;
  createdById?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  skip?: number;
  take?: number;
}

export interface CampaignWithRelations extends Campaign {
  client: {
    id: string;
    name: string;
  };
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  _count: {
    tasks: number;
  };
}

export class CampaignsRepository {
  async findMany(filters: CampaignFilters): Promise<{ campaigns: CampaignWithRelations[]; total: number }> {
    const where: Prisma.CampaignWhereInput = {
      deletedAt: null,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }

    if (filters.createdById) {
      where.createdById = filters.createdById;
    }

    if (filters.startDate || filters.endDate) {
      where.OR = [];
      if (filters.startDate) {
        where.OR.push({ startDate: { gte: filters.startDate } });
      }
      if (filters.endDate) {
        where.OR.push({ endDate: { lte: filters.endDate } });
      }
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip: filters.skip,
        take: filters.take,
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.campaign.count({ where }),
    ]);

    return {
      campaigns: campaigns as CampaignWithRelations[],
      total,
    };
  }

  async findById(id: string): Promise<CampaignWithRelations | null> {
    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        tasks: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return campaign as CampaignWithRelations | null;
  }

  async create(data: Prisma.CampaignCreateInput): Promise<Campaign> {
    return prisma.campaign.create({
      data,
    });
  }

  async update(id: string, data: Prisma.CampaignUpdateInput): Promise<Campaign> {
    return prisma.campaign.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, status: CampaignStatus): Promise<Campaign> {
    return prisma.campaign.update({
      where: { id },
      data: { status },
    });
  }

  async softDelete(id: string): Promise<Campaign> {
    return prisma.campaign.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'cancelled',
      },
    });
  }

  async getMetrics(campaignId: string): Promise<{
    budget: number;
    actualSpend: number;
    budgetRemaining: number;
    budgetUtilization: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    notStartedTasks: number;
    kpiProgress: Record<string, any>;
  }> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        budget: true,
        actualSpend: true,
        kpiTarget: true,
        kpiActual: true,
      },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const tasks = await prisma.task.findMany({
      where: {
        campaignId,
        deletedAt: null,
      },
      select: {
        status: true,
      },
    });

    const budget = campaign.budget ? Number(campaign.budget) : 0;
    const actualSpend = campaign.actualSpend ? Number(campaign.actualSpend) : 0;
    const budgetRemaining = budget - actualSpend;
    const budgetUtilization = budget > 0 ? (actualSpend / budget) * 100 : 0;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
    const notStartedTasks = tasks.filter((t) => t.status === 'not_started').length;

    let kpiProgress: Record<string, any> = {};
    try {
      const kpiTarget = campaign.kpiTarget ? JSON.parse(campaign.kpiTarget) : {};
      const kpiActual = campaign.kpiActual ? JSON.parse(campaign.kpiActual) : {};
      
      Object.keys(kpiTarget).forEach((key) => {
        const target = Number(kpiTarget[key]) || 0;
        const actual = Number(kpiActual[key]) || 0;
        kpiProgress[key] = {
          target,
          actual,
          progress: target > 0 ? (actual / target) * 100 : 0,
        };
      });
    } catch (error) {
      // Invalid JSON, ignore
    }

    return {
      budget,
      actualSpend,
      budgetRemaining,
      budgetUtilization,
      totalTasks,
      completedTasks,
      inProgressTasks,
      notStartedTasks,
      kpiProgress,
    };
  }
}

export const campaignsRepository = new CampaignsRepository();

