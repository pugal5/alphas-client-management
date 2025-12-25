import { Prisma, Expense, ExpenseStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface ExpenseFilters {
  status?: ExpenseStatus;
  createdById?: string;
  approvedById?: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  skip?: number;
  take?: number;
}

export interface ExpenseWithRelations extends Expense {
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approver: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export class ExpensesRepository {
  async findMany(filters: ExpenseFilters): Promise<{ expenses: ExpenseWithRelations[]; total: number }> {
    const where: Prisma.ExpenseWhereInput = {
      deletedAt: null,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.createdById) {
      where.createdById = filters.createdById;
    }

    if (filters.approvedById) {
      where.approvedById = filters.approvedById;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.expenseDate = {};
      if (filters.dateFrom) {
        where.expenseDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.expenseDate.lte = filters.dateTo;
      }
    }

    if (filters.search) {
      where.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { category: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip: filters.skip,
        take: filters.take,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          approver: {
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
      prisma.expense.count({ where }),
    ]);

    return {
      expenses: expenses as ExpenseWithRelations[],
      total,
    };
  }

  async findById(id: string): Promise<ExpenseWithRelations | null> {
    return prisma.expense.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }) as Promise<ExpenseWithRelations | null>;
  }

  async create(data: Prisma.ExpenseCreateInput): Promise<Expense> {
    return prisma.expense.create({
      data,
    });
  }

  async update(id: string, data: Prisma.ExpenseUpdateInput): Promise<Expense> {
    return prisma.expense.update({
      where: { id },
      data,
    });
  }

  async approve(id: string, approverId: string): Promise<Expense> {
    return prisma.expense.update({
      where: { id },
      data: {
        status: 'approved',
        approvedById: approverId,
        approvedAt: new Date(),
      },
    });
  }

  async reject(id: string, approverId: string): Promise<Expense> {
    return prisma.expense.update({
      where: { id },
      data: {
        status: 'rejected',
        approvedById: approverId,
        approvedAt: new Date(),
      },
    });
  }

  async softDelete(id: string): Promise<Expense> {
    return prisma.expense.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

export const expensesRepository = new ExpensesRepository();

