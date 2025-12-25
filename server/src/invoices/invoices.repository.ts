import { Prisma, Invoice, InvoiceStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface InvoiceFilters {
  status?: InvoiceStatus;
  paymentStatus?: PaymentStatus;
  clientId?: string;
  createdById?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  search?: string;
  skip?: number;
  take?: number;
}

export interface InvoiceWithRelations extends Invoice {
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
}

export class InvoicesRepository {
  async findMany(filters: InvoiceFilters): Promise<{ invoices: InvoiceWithRelations[]; total: number }> {
    const where: Prisma.InvoiceWhereInput = {
      deletedAt: null,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.createdById) {
      where.createdById = filters.createdById;
    }

    if (filters.dueDateFrom || filters.dueDateTo) {
      where.dueDate = {};
      if (filters.dueDateFrom) {
        where.dueDate.gte = filters.dueDateFrom;
      }
      if (filters.dueDateTo) {
        where.dueDate.lte = filters.dueDateTo;
      }
    }

    if (filters.search) {
      where.OR = [
        { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
        { client: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
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
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      invoices: invoices as InvoiceWithRelations[],
      total,
    };
  }

  async findById(id: string): Promise<InvoiceWithRelations | null> {
    return prisma.invoice.findFirst({
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
      },
    }) as Promise<InvoiceWithRelations | null>;
  }

  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    // Find the highest invoice number for this year
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
      select: {
        invoiceNumber: true,
      },
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const lastNumberStr = lastInvoice.invoiceNumber.replace(prefix, '');
      const lastNumber = parseInt(lastNumberStr, 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  async create(data: Prisma.InvoiceCreateInput): Promise<Invoice> {
    return prisma.invoice.create({
      data,
    });
  }

  async update(id: string, data: Prisma.InvoiceUpdateInput): Promise<Invoice> {
    return prisma.invoice.update({
      where: { id },
      data,
    });
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus, paidDate?: Date): Promise<Invoice> {
    const updateData: Prisma.InvoiceUpdateInput = {
      paymentStatus,
    };

    if (paymentStatus === 'paid' && paidDate) {
      updateData.paidDate = paidDate;
      updateData.status = 'paid';
    } else if (paymentStatus === 'paid') {
      updateData.paidDate = new Date();
      updateData.status = 'paid';
    }

    return prisma.invoice.update({
      where: { id },
      data: updateData,
    });
  }

  async softDelete(id: string): Promise<Invoice> {
    return prisma.invoice.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'cancelled',
      },
    });
  }

  async getOverdueInvoices(): Promise<Invoice[]> {
    return prisma.invoice.findMany({
      where: {
        deletedAt: null,
        dueDate: {
          lt: new Date(),
        },
        paymentStatus: {
          not: 'paid',
        },
        status: {
          not: 'cancelled',
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}

export const invoicesRepository = new InvoicesRepository();

