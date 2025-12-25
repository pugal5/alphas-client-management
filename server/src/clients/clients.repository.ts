import { Prisma, Client, ClientStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface ClientFilters {
  status?: ClientStatus;
  ownerId?: string;
  industry?: string;
  search?: string;
  skip?: number;
  take?: number;
}

export interface ClientWithRelations extends Client {
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  contacts: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    isPrimary: boolean;
  }>;
  _count: {
    campaigns: number;
    invoices: number;
    tasks: number;
  };
}

export class ClientsRepository {
  async findMany(filters: ClientFilters): Promise<{ clients: ClientWithRelations[]; total: number }> {
    const where: Prisma.ClientWhereInput = {
      deletedAt: null,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }

    if (filters.industry) {
      where.industry = filters.industry;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { industry: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip: filters.skip,
        take: filters.take,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          contacts: {
            where: { deletedAt: null },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              isPrimary: true,
            },
          },
          _count: {
            select: {
              campaigns: true,
              invoices: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.client.count({ where }),
    ]);

    // Get task counts separately (tasks are linked via campaigns)
    const clientsWithTaskCounts = await Promise.all(
      clients.map(async (client) => {
        const taskCount = await prisma.task.count({
          where: {
            campaign: {
              clientId: client.id,
            },
            deletedAt: null,
          },
        });

        return {
          ...client,
          _count: {
            ...client._count,
            tasks: taskCount,
          },
        };
      })
    );

    return {
      clients: clientsWithTaskCounts as ClientWithRelations[],
      total,
    };
  }

  async findById(id: string): Promise<ClientWithRelations | null> {
    const client = await prisma.client.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        contacts: {
          where: { deletedAt: null },
          orderBy: { isPrimary: 'desc' },
        },
        campaigns: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            status: true,
            budget: true,
            actualSpend: true,
          },
        },
        invoices: {
          where: { deletedAt: null },
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
            paymentStatus: true,
            dueDate: true,
          },
        },
        _count: {
          select: {
            campaigns: true,
            invoices: true,
          },
        },
      },
    });

    if (!client) return null;

    const taskCount = await prisma.task.count({
      where: {
        campaign: {
          clientId: client.id,
        },
        deletedAt: null,
      },
    });

    return {
      ...client,
      _count: {
        ...client._count,
        tasks: taskCount,
      },
    } as ClientWithRelations;
  }

  async create(data: Prisma.ClientCreateInput): Promise<Client> {
    return prisma.client.create({
      data,
    });
  }

  async update(id: string, data: Prisma.ClientUpdateInput): Promise<Client> {
    return prisma.client.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Client> {
    return prisma.client.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'archived',
      },
    });
  }

  async getMetrics(clientId: string): Promise<{
    totalRevenue: number;
    activeCampaigns: number;
    completedCampaigns: number;
    totalTasks: number;
    completedTasks: number;
    overdueInvoices: number;
    totalInvoices: number;
  }> {
    const [invoices, campaigns, tasks] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          clientId,
          deletedAt: null,
          paymentStatus: 'paid',
        },
        select: { total: true },
      }),
      prisma.campaign.findMany({
        where: {
          clientId,
          deletedAt: null,
        },
        select: { status: true },
      }),
      prisma.task.findMany({
        where: {
          campaign: {
            clientId,
          },
          deletedAt: null,
        },
        select: { status: true },
      }),
    ]);

    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
    const completedCampaigns = campaigns.filter((c) => c.status === 'completed').length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;

    const overdueInvoices = await prisma.invoice.count({
      where: {
        clientId,
        deletedAt: null,
        dueDate: { lt: new Date() },
        paymentStatus: { not: 'paid' },
      },
    });

    const totalInvoices = await prisma.invoice.count({
      where: {
        clientId,
        deletedAt: null,
      },
    });

    return {
      totalRevenue,
      activeCampaigns,
      completedCampaigns,
      totalTasks,
      completedTasks,
      overdueInvoices,
      totalInvoices,
    };
  }
}

export const clientsRepository = new ClientsRepository();

