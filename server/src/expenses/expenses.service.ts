import { Expense, Prisma } from '@prisma/client';
import { expensesRepository, ExpenseFilters, ExpenseWithRelations } from './expenses.repository.js';
import { prisma } from '../lib/prisma.js';
import { rbacService } from '../rbac/rbac.service.js';

export interface CreateExpenseData {
  description: string;
  amount: number;
  category?: string;
  receiptUrl?: string;
  expenseDate?: Date;
  notes?: string;
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {}

export class ExpensesService {
  async getExpenses(filters: ExpenseFilters, userId: string): Promise<{ expenses: ExpenseWithRelations[]; total: number }> {
    const hasAccess = await rbacService.checkPermission(userId, 'expenses', 'read');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Finance and admin can see all, others see only their own
    if (user?.role !== 'admin' && user?.role !== 'finance') {
      filters.createdById = userId;
    }

    return expensesRepository.findMany(filters);
  }

  async getExpenseById(id: string, userId: string): Promise<ExpenseWithRelations> {
    const expense = await expensesRepository.findById(id);
    if (!expense) {
      throw new Error('Expense not found');
    }

    const hasAccess = await rbacService.checkResourceAccess(userId, 'expenses', id, 'read');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    return expense;
  }

  async createExpense(data: CreateExpenseData, userId: string): Promise<Expense> {
    const hasAccess = await rbacService.checkPermission(userId, 'expenses', 'create');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const expense = await expensesRepository.create({
      description: data.description,
      amount: new Prisma.Decimal(data.amount),
      category: data.category,
      receiptUrl: data.receiptUrl,
      expenseDate: data.expenseDate || new Date(),
      notes: data.notes,
      status: 'pending',
      creator: {
        connect: { id: userId },
      },
    });

    return expense;
  }

  async updateExpense(id: string, data: UpdateExpenseData, userId: string): Promise<Expense> {
    const expense = await expensesRepository.findById(id);
    if (!expense) {
      throw new Error('Expense not found');
    }

    // Only creator can update pending expenses
    if (expense.status !== 'pending' && expense.createdById !== userId) {
      const hasAccess = await rbacService.checkPermission(userId, 'expenses', 'update');
      if (!hasAccess) {
        throw new Error('Insufficient permissions');
      }
    }

    const updateData: Prisma.ExpenseUpdateInput = {};
    if (data.description) updateData.description = data.description;
    if (data.amount !== undefined) updateData.amount = new Prisma.Decimal(data.amount);
    if (data.category !== undefined) updateData.category = data.category;
    if (data.receiptUrl !== undefined) updateData.receiptUrl = data.receiptUrl;
    if (data.expenseDate) updateData.expenseDate = data.expenseDate;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return expensesRepository.update(id, updateData);
  }

  async approveExpense(id: string, userId: string): Promise<Expense> {
    const hasAccess = await rbacService.checkPermission(userId, 'expenses', 'update');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    return expensesRepository.approve(id, userId);
  }

  async rejectExpense(id: string, userId: string): Promise<Expense> {
    const hasAccess = await rbacService.checkPermission(userId, 'expenses', 'update');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    return expensesRepository.reject(id, userId);
  }

  async deleteExpense(id: string, userId: string): Promise<void> {
    const expense = await expensesRepository.findById(id);
    if (!expense) {
      throw new Error('Expense not found');
    }

    // Only creator can delete pending expenses
    if (expense.status !== 'pending' || expense.createdById !== userId) {
      const hasAccess = await rbacService.checkPermission(userId, 'expenses', 'delete');
      if (!hasAccess) {
        throw new Error('Insufficient permissions');
      }
    }

    await expensesRepository.softDelete(id);
  }
}

export const expensesService = new ExpensesService();

