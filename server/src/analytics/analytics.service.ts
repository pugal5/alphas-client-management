import { prisma } from '../lib/prisma';
import { rbacService } from '../rbac/rbac.service';
import { Prisma } from '@prisma/client';

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  clientId?: string;
  campaignId?: string;
  userId?: string;
}

export class AnalyticsService {
  async getCampaignROI(filters: AnalyticsFilters, userId: string): Promise<{
    campaignId: string;
    campaignName: string;
    revenue: number;
    spend: number;
    roi: number;
  }[]> {
    const hasAccess = await rbacService.checkPermission(userId, 'analytics', 'read');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const where: Prisma.CampaignWhereInput = {
      deletedAt: null,
    };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.campaignId) {
      where.id = filters.campaignId;
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        client: {
          select: {
            invoices: {
              where: {
                deletedAt: null,
                paymentStatus: 'paid',
                campaign: {
                  id: { not: null },
                },
              },
              select: {
                total: true,
              },
            },
          },
        },
      },
    });

    return campaigns.map((campaign) => {
      const revenue = campaign.client.invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
      const spend = campaign.actualSpend ? Number(campaign.actualSpend) : 0;
      const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        revenue,
        spend,
        roi,
      };
    });
  }

  async getTeamUtilization(filters: AnalyticsFilters, userId: string): Promise<{
    userId: string;
    userName: string;
    billableHours: number;
    availableHours: number;
    utilization: number;
  }[]> {
    const hasAccess = await rbacService.checkPermission(userId, 'analytics', 'read');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const where: Prisma.TaskWhereInput = {
      deletedAt: null,
    };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    if (filters.userId) {
      where.assignedToId = filters.userId;
    }

    const tasks = await prisma.task.findMany({
      where,
      select: {
        assignedToId: true,
        actualHours: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const userStats = new Map<string, { billableHours: number; userName: string }>();

    tasks.forEach((task) => {
      if (task.assignedToId && task.actualHours) {
        const current = userStats.get(task.assignedToId) || {
          billableHours: 0,
          userName: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Unknown',
        };
        current.billableHours += Number(task.actualHours);
        userStats.set(task.assignedToId, current);
      }
    });

    // Assume 40 hours per week available
    const weeksInPeriod = filters.startDate && filters.endDate
      ? Math.ceil((filters.endDate.getTime() - filters.startDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
      : 1;
    const availableHours = weeksInPeriod * 40;

    return Array.from(userStats.entries()).map(([userId, stats]) => ({
      userId,
      userName: stats.userName,
      billableHours: stats.billableHours,
      availableHours,
      utilization: (stats.billableHours / availableHours) * 100,
    }));
  }

  async getTaskOnTimePercentage(filters: AnalyticsFilters, userId: string): Promise<{
    totalCompleted: number;
    completedOnTime: number;
    onTimePercentage: number;
  }> {
    const hasAccess = await rbacService.checkPermission(userId, 'analytics', 'read');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const where: Prisma.TaskWhereInput = {
      deletedAt: null,
      status: 'completed',
    };

    if (filters.startDate || filters.endDate) {
      where.completedDate = {};
      if (filters.startDate) where.completedDate.gte = filters.startDate;
      if (filters.endDate) where.completedDate.lte = filters.endDate;
    }

    const completedTasks = await prisma.task.findMany({
      where,
      select: {
        dueDate: true,
        completedDate: true,
      },
    });

    const totalCompleted = completedTasks.length;
    const completedOnTime = completedTasks.filter(
      (task) => task.completedDate && task.dueDate && task.completedDate <= task.dueDate
    ).length;

    return {
      totalCompleted,
      completedOnTime,
      onTimePercentage: totalCompleted > 0 ? (completedOnTime / totalCompleted) * 100 : 0,
    };
  }

  async getClientProfitability(filters: AnalyticsFilters, userId: string): Promise<{
    clientId: string;
    clientName: string;
    revenue: number;
    expenses: number;
    profit: number;
    profitMargin: number;
  }[]> {
    const hasAccess = await rbacService.checkPermission(userId, 'analytics', 'read');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const where: Prisma.ClientWhereInput = {
      deletedAt: null,
    };

    if (filters.clientId) {
      where.id = filters.clientId;
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        invoices: {
          where: {
            deletedAt: null,
            paymentStatus: 'paid',
          },
          select: {
            total: true,
          },
        },
        campaigns: {
          where: {
            deletedAt: null,
          },
          select: {
            actualSpend: true,
          },
        },
      },
    });

    return clients.map((client) => {
      const revenue = client.invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
      const expenses = client.campaigns.reduce(
        (sum, camp) => sum + (camp.actualSpend ? Number(camp.actualSpend) : 0),
        0
      );
      const profit = revenue - expenses;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        clientId: client.id,
        clientName: client.name,
        revenue,
        expenses,
        profit,
        profitMargin,
      };
    });
  }

  async getBudgetAccuracy(filters: AnalyticsFilters, userId: string): Promise<{
    campaignId: string;
    campaignName: string;
    budget: number;
    actualSpend: number;
    variance: number;
    variancePercentage: number;
  }[]> {
    const hasAccess = await rbacService.checkPermission(userId, 'analytics', 'read');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const where: Prisma.CampaignWhereInput = {
      deletedAt: null,
      budget: { not: null },
    };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      select: {
        id: true,
        name: true,
        budget: true,
        actualSpend: true,
      },
    });

    return campaigns.map((campaign) => {
      const budget = campaign.budget ? Number(campaign.budget) : 0;
      const actualSpend = campaign.actualSpend ? Number(campaign.actualSpend) : 0;
      const variance = actualSpend - budget;
      const variancePercentage = budget > 0 ? (variance / budget) * 100 : 0;

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        budget,
        actualSpend,
        variance,
        variancePercentage,
      };
    });
  }

  async getDashboardMetrics(userId: string): Promise<{
    totalClients: number;
    activeCampaigns: number;
    totalTasks: number;
    completedTasks: number;
    totalRevenue: number;
    pendingInvoices: number;
    overdueInvoices: number;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const clientWhere: Prisma.ClientWhereInput = { deletedAt: null };
    const campaignWhere: Prisma.CampaignWhereInput = { deletedAt: null };
    const taskWhere: Prisma.TaskWhereInput = { deletedAt: null };
    const invoiceWhere: Prisma.InvoiceWhereInput = { deletedAt: null };

    // Filter by ownership if not admin/manager
    if (user?.role !== 'admin' && user?.role !== 'manager') {
      campaignWhere.assignedToId = userId;
      taskWhere.assignedToId = userId;
      invoiceWhere.createdById = userId;
    }

    const [
      totalClients,
      activeCampaigns,
      totalTasks,
      completedTasks,
      invoices,
      overdueInvoices,
    ] = await Promise.all([
      prisma.client.count({ where: clientWhere }),
      prisma.campaign.count({ where: { ...campaignWhere, status: 'active' } }),
      prisma.task.count({ where: taskWhere }),
      prisma.task.count({ where: { ...taskWhere, status: 'completed' } }),
      prisma.invoice.findMany({
        where: { ...invoiceWhere, paymentStatus: 'pending' },
        select: { total: true },
      }),
      prisma.invoice.count({
        where: {
          ...invoiceWhere,
          dueDate: { lt: new Date() },
          paymentStatus: { not: 'paid' },
        },
      }),
    ]);

    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);

    return {
      totalClients,
      activeCampaigns,
      totalTasks,
      completedTasks,
      totalRevenue,
      pendingInvoices: invoices.length,
      overdueInvoices,
    };
  }
}

export const analyticsService = new AnalyticsService();

