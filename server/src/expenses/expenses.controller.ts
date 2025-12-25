import { Request, Response } from 'express';
import { expensesService } from './expenses.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';
import { ExpenseStatus } from '@prisma/client';

const createExpenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().min(0),
  category: z.string().optional(),
  receiptUrl: z.string().url().optional().or(z.literal('')),
  expenseDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const updateExpenseSchema = createExpenseSchema.partial();

export class ExpensesController {
  async getExpenses(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const filters = {
        status: req.query.status as ExpenseStatus | undefined,
        createdById: req.query.createdById as string | undefined,
        approvedById: req.query.approvedById as string | undefined,
        category: req.query.category as string | undefined,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        search: req.query.search as string | undefined,
        skip: req.query.skip ? parseInt(req.query.skip as string) : undefined,
        take: req.query.take ? parseInt(req.query.take as string) : undefined,
      };

      const result = await expensesService.getExpenses(filters, req.user.userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getExpenseById(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const expense = await expensesService.getExpenseById(req.params.id, req.user.userId);
      res.json(expense);
    } catch (error) {
      if ((error as Error).message === 'Expense not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(403).json({ error: (error as Error).message });
    }
  }

  async createExpense(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = createExpenseSchema.parse(req.body);
      const expense = await expensesService.createExpense(
        {
          ...validatedData,
          expenseDate: validatedData.expenseDate ? new Date(validatedData.expenseDate) : undefined,
        },
        req.user.userId
      );
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async updateExpense(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = updateExpenseSchema.parse(req.body);
      const expense = await expensesService.updateExpense(
        req.params.id,
        {
          ...validatedData,
          expenseDate: validatedData.expenseDate ? new Date(validatedData.expenseDate) : undefined,
        },
        req.user.userId
      );
      res.json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async approveExpense(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const expense = await expensesService.approveExpense(req.params.id, req.user.userId);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async rejectExpense(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const expense = await expensesService.rejectExpense(req.params.id, req.user.userId);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async deleteExpense(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      await expensesService.deleteExpense(req.params.id, req.user.userId);
      res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export const expensesController = new ExpensesController();

