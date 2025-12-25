import { Invoice, InvoiceStatus, PaymentStatus, Prisma } from '@prisma/client';
import { invoicesRepository, InvoiceFilters, InvoiceWithRelations } from './invoices.repository';
import { prisma } from '../lib/prisma';
import { rbacService } from '../rbac/rbac.service';

export interface CreateInvoiceData {
  clientId: string;
  status?: InvoiceStatus;
  issueDate?: Date;
  dueDate: Date;
  subtotal: number;
  tax?: number;
  discount?: number;
  notes?: string;
}

export interface UpdateInvoiceData extends Partial<CreateInvoiceData> {}

export class InvoicesService {
  async getInvoices(filters: InvoiceFilters, userId: string): Promise<{ invoices: InvoiceWithRelations[]; total: number }> {
    const hasAccess = await rbacService.checkPermission(userId, 'invoices', 'read');
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

    return invoicesRepository.findMany(filters);
  }

  async getInvoiceById(id: string, userId: string): Promise<InvoiceWithRelations> {
    const invoice = await invoicesRepository.findById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const hasAccess = await rbacService.checkResourceAccess(userId, 'invoices', id, 'read');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    return invoice;
  }

  async createInvoice(data: CreateInvoiceData, userId: string): Promise<Invoice> {
    const hasAccess = await rbacService.checkPermission(userId, 'invoices', 'create');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const invoiceNumber = await invoicesRepository.generateInvoiceNumber();
    const total = data.subtotal + (data.tax || 0) - (data.discount || 0);

    const invoice = await invoicesRepository.create({
      invoiceNumber,
      client: {
        connect: { id: data.clientId },
      },
      status: data.status || 'draft',
      issueDate: data.issueDate || new Date(),
      dueDate: data.dueDate,
      subtotal: new Prisma.Decimal(data.subtotal),
      tax: data.tax ? new Prisma.Decimal(data.tax) : new Prisma.Decimal(0),
      discount: data.discount ? new Prisma.Decimal(data.discount) : new Prisma.Decimal(0),
      total: new Prisma.Decimal(total),
      paymentStatus: 'pending',
      notes: data.notes,
      creator: {
        connect: { id: userId },
      },
    });

    await prisma.activity.create({
      data: {
        type: 'invoice_sent',
        title: `Invoice created: ${invoiceNumber}`,
        userId,
        clientId: data.clientId,
        invoiceId: invoice.id,
      },
    });

    return invoice;
  }

  async updateInvoice(id: string, data: UpdateInvoiceData, userId: string): Promise<Invoice> {
    const hasAccess = await rbacService.checkResourceAccess(userId, 'invoices', id, 'update');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const updateData: Prisma.InvoiceUpdateInput = {};
    if (data.clientId) {
      updateData.client = { connect: { id: data.clientId } };
    }
    if (data.status) updateData.status = data.status;
    if (data.issueDate) updateData.issueDate = data.issueDate;
    if (data.dueDate) updateData.dueDate = data.dueDate;
    if (data.subtotal !== undefined) updateData.subtotal = new Prisma.Decimal(data.subtotal);
    if (data.tax !== undefined) updateData.tax = new Prisma.Decimal(data.tax);
    if (data.discount !== undefined) updateData.discount = new Prisma.Decimal(data.discount);
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Recalculate total if financial fields changed
    if (data.subtotal !== undefined || data.tax !== undefined || data.discount !== undefined) {
      const invoice = await invoicesRepository.findById(id);
      if (invoice) {
        const subtotal = data.subtotal !== undefined ? data.subtotal : Number(invoice.subtotal);
        const tax = data.tax !== undefined ? data.tax : Number(invoice.tax);
        const discount = data.discount !== undefined ? data.discount : Number(invoice.discount);
        updateData.total = new Prisma.Decimal(subtotal + tax - discount);
      }
    }

    const invoice = await invoicesRepository.update(id, updateData);

    await prisma.activity.create({
      data: {
        type: 'invoice_sent',
        title: `Invoice updated: ${invoice.invoiceNumber}`,
        userId,
        invoiceId: invoice.id,
      },
    });

    return invoice;
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus, userId: string, paidDate?: Date): Promise<Invoice> {
    const hasAccess = await rbacService.checkResourceAccess(userId, 'invoices', id, 'update');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const invoice = await invoicesRepository.updatePaymentStatus(id, paymentStatus, paidDate);

    await prisma.activity.create({
      data: {
        type: paymentStatus === 'paid' ? 'payment_received' : 'invoice_sent',
        title: `Invoice payment status updated: ${invoice.invoiceNumber} -> ${paymentStatus}`,
        userId,
        invoiceId: invoice.id,
        metadata: {
          paymentStatus,
        },
      },
    });

    return invoice;
  }

  async sendInvoice(id: string, userId: string): Promise<Invoice> {
    const hasAccess = await rbacService.checkResourceAccess(userId, 'invoices', id, 'update');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const invoice = await invoicesRepository.update(id, {
      status: 'sent',
    });

    await prisma.activity.create({
      data: {
        type: 'invoice_sent',
        title: `Invoice sent: ${invoice.invoiceNumber}`,
        userId,
        invoiceId: invoice.id,
      },
    });

    return invoice;
  }

  async deleteInvoice(id: string, userId: string): Promise<void> {
    const hasAccess = await rbacService.checkResourceAccess(userId, 'invoices', id, 'delete');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    await invoicesRepository.softDelete(id);
  }

  async getOverdueInvoices(userId: string): Promise<Invoice[]> {
    const hasAccess = await rbacService.checkPermission(userId, 'invoices', 'read');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    return invoicesRepository.getOverdueInvoices();
  }
}

export const invoicesService = new InvoicesService();

