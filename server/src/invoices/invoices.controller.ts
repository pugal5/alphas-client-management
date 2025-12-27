import { Response } from 'express';
import { invoicesService } from './invoices.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';
import { InvoiceStatus, PaymentStatus } from '@prisma/client';

const createInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime(),
  subtotal: z.number().min(0),
  tax: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const updateInvoiceSchema = createInvoiceSchema.partial();

const updatePaymentStatusSchema = z.object({
  paymentStatus: z.nativeEnum(PaymentStatus),
  paidDate: z.string().datetime().optional(),
});

export class InvoicesController {
  async getInvoices(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const filters = {
        status: req.query.status as InvoiceStatus | undefined,
        paymentStatus: req.query.paymentStatus as PaymentStatus | undefined,
        clientId: req.query.clientId as string | undefined,
        createdById: req.query.createdById as string | undefined,
        dueDateFrom: req.query.dueDateFrom ? new Date(req.query.dueDateFrom as string) : undefined,
        dueDateTo: req.query.dueDateTo ? new Date(req.query.dueDateTo as string) : undefined,
        search: req.query.search as string | undefined,
        skip: req.query.skip ? parseInt(req.query.skip as string) : undefined,
        take: req.query.take ? parseInt(req.query.take as string) : undefined,
      };

      const result = await invoicesService.getInvoices(filters, req.user.userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getInvoiceById(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const invoice = await invoicesService.getInvoiceById(req.params.id, req.user.userId);
      res.json(invoice);
    } catch (error) {
      if ((error as Error).message === 'Invoice not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(403).json({ error: (error as Error).message });
    }
  }

  async createInvoice(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = createInvoiceSchema.parse(req.body);
      const invoice = await invoicesService.createInvoice(
        {
          ...validatedData,
          issueDate: validatedData.issueDate ? new Date(validatedData.issueDate) : undefined,
          dueDate: new Date(validatedData.dueDate),
        },
        req.user.userId
      );
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async updateInvoice(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = updateInvoiceSchema.parse(req.body);
      const invoice = await invoicesService.updateInvoice(
        req.params.id,
        {
          ...validatedData,
          issueDate: validatedData.issueDate ? new Date(validatedData.issueDate) : undefined,
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
        },
        req.user.userId
      );
      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async updatePaymentStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { paymentStatus, paidDate } = updatePaymentStatusSchema.parse(req.body);
      const invoice = await invoicesService.updatePaymentStatus(
        req.params.id,
        paymentStatus,
        req.user.userId,
        paidDate ? new Date(paidDate) : undefined
      );
      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async sendInvoice(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const invoice = await invoicesService.sendInvoice(req.params.id, req.user.userId);
      res.json(invoice);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async deleteInvoice(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      await invoicesService.deleteInvoice(req.params.id, req.user.userId);
      res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async getOverdueInvoices(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const invoices = await invoicesService.getOverdueInvoices(req.user.userId);
      res.json(invoices);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export const invoicesController = new InvoicesController();

