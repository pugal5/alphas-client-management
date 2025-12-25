import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { hasPermission, Resource, Action } from './permissions';

export class RBACService {
  async checkPermission(
    userId: string,
    resource: Resource,
    action: Action
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return false;
    }

    return hasPermission(user.role, resource, action);
  }

  async checkResourceAccess(
    userId: string,
    resource: Resource,
    resourceId: string,
    action: Action
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, id: true },
    });

    if (!user) {
      return false;
    }

    // Admin has full access
    if (user.role === UserRole.admin) {
      return true;
    }

    // Check basic permission
    if (!hasPermission(user.role, resource, action)) {
      return false;
    }

    // Check resource-specific ownership/assignment
    switch (resource) {
      case 'clients':
        return this.checkClientAccess(userId, user.role, resourceId, action);
      case 'campaigns':
        return this.checkCampaignAccess(userId, user.role, resourceId, action);
      case 'tasks':
        return this.checkTaskAccess(userId, user.role, resourceId, action);
      case 'invoices':
        return this.checkInvoiceAccess(userId, user.role, resourceId, action);
      default:
        return hasPermission(user.role, resource, action);
    }
  }

  private async checkClientAccess(
    userId: string,
    role: UserRole,
    clientId: string,
    action: Action
  ): Promise<boolean> {
    if (role === UserRole.admin || role === UserRole.manager) {
      return true;
    }

    if (role === UserRole.client_viewer) {
      // Client viewers can only access their own client
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { ownerId: true },
      });
      // For client_viewer, we'd need to link user to client differently
      // This is a simplified check
      return true; // TODO: Implement proper client-user relationship
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { ownerId: true },
    });

    return client?.ownerId === userId;
  }

  private async checkCampaignAccess(
    userId: string,
    role: UserRole,
    campaignId: string,
    action: Action
  ): Promise<boolean> {
    if (role === UserRole.admin || role === UserRole.manager) {
      return true;
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { createdById: true, assignedToId: true },
    });

    return campaign?.createdById === userId || campaign?.assignedToId === userId;
  }

  private async checkTaskAccess(
    userId: string,
    role: UserRole,
    taskId: string,
    action: Action
  ): Promise<boolean> {
    if (role === UserRole.admin || role === UserRole.manager) {
      return true;
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { createdById: true, assignedToId: true },
    });

    return task?.createdById === userId || task?.assignedToId === userId;
  }

  private async checkInvoiceAccess(
    userId: string,
    role: UserRole,
    invoiceId: string,
    action: Action
  ): Promise<boolean> {
    if (role === UserRole.admin || role === UserRole.finance) {
      return true;
    }

    if (role === UserRole.client_viewer) {
      // Client viewers can only see invoices for their client
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        select: { clientId: true },
      });
      // TODO: Check if user is linked to this client
      return true;
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { createdById: true },
    });

    return invoice?.createdById === userId;
  }
}

export const rbacService = new RBACService();

