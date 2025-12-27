import { Client, ClientStatus, Prisma } from '@prisma/client';
import { clientsRepository, ClientFilters, ClientWithRelations } from './clients.repository.js';
import { prisma } from '../lib/prisma.js';
import { rbacService } from '../rbac/rbac.service.js';
import { webSocketService } from '../websocket/websocket.service.js';

export interface CreateClientData {
  name: string;
  industry?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  status?: ClientStatus;
  contractValue?: number;
  contractStart?: Date;
  contractEnd?: Date;
  notes?: string;
  ownerId: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {}

export interface CreateContactData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  isPrimary?: boolean;
  notes?: string;
}

export class ClientsService {
  async getClients(filters: ClientFilters, userId: string): Promise<{ clients: ClientWithRelations[]; total: number }> {
    // Check permission
    const hasAccess = await rbacService.checkPermission(userId, 'clients', 'read');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    // If not admin/manager, filter by ownership
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'admin' && user?.role !== 'manager') {
      filters.ownerId = userId;
    }

    return clientsRepository.findMany(filters);
  }

  async getClientById(id: string, userId: string): Promise<ClientWithRelations> {
    const client = await clientsRepository.findById(id);
    if (!client) {
      throw new Error('Client not found');
    }

    // Check resource access
    const hasAccess = await rbacService.checkResourceAccess(userId, 'clients', id, 'read');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    return client;
  }

  async createClient(data: CreateClientData, userId: string): Promise<Client> {
    // Check permission
    const hasAccess = await rbacService.checkPermission(userId, 'clients', 'create');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const client = await clientsRepository.create({
      name: data.name,
      industry: data.industry,
      website: data.website,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      country: data.country,
      phone: data.phone,
      email: data.email,
      status: data.status || 'prospect',
      contractValue: data.contractValue ? new Prisma.Decimal(data.contractValue) : null,
      contractStart: data.contractStart,
      contractEnd: data.contractEnd,
      notes: data.notes,
      owner: {
        connect: { id: data.ownerId },
      },
    });

    // Create activity log
    const activity = await prisma.activity.create({
      data: {
        type: 'other',
        title: `Client created: ${client.name}`,
        userId,
        clientId: client.id,
      },
    });

    // Emit WebSocket event
    webSocketService.emitClientUpdated(client.id, { client });
    webSocketService.emitActivityAdded(activity);

    return client;
  }

  async updateClient(id: string, data: UpdateClientData, userId: string): Promise<Client> {
    // Check resource access
    const hasAccess = await rbacService.checkResourceAccess(userId, 'clients', id, 'update');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const updateData: Prisma.ClientUpdateInput = {};
    if (data.name) updateData.name = data.name;
    if (data.industry !== undefined) updateData.industry = data.industry;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.status) updateData.status = data.status;
    if (data.contractValue !== undefined) updateData.contractValue = new Prisma.Decimal(data.contractValue);
    if (data.contractStart !== undefined) updateData.contractStart = data.contractStart;
    if (data.contractEnd !== undefined) updateData.contractEnd = data.contractEnd;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.ownerId) {
      updateData.owner = { connect: { id: data.ownerId } };
    }

    const client = await clientsRepository.update(id, updateData);

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'other',
        title: `Client updated: ${client.name}`,
        userId,
        clientId: client.id,
      },
    });

    return client;
  }

  async deleteClient(id: string, userId: string): Promise<void> {
    // Check resource access
    const hasAccess = await rbacService.checkResourceAccess(userId, 'clients', id, 'delete');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    await clientsRepository.softDelete(id);

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'other',
        title: `Client archived`,
        userId,
        clientId: id,
      },
    });
  }

  async addContact(clientId: string, data: CreateContactData, userId: string): Promise<void> {
    // Check resource access
    const hasAccess = await rbacService.checkResourceAccess(userId, 'clients', clientId, 'update');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    // If setting as primary, unset other primary contacts
    if (data.isPrimary) {
      await prisma.clientContact.updateMany({
        where: {
          clientId,
          isPrimary: true,
          deletedAt: null,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    await prisma.clientContact.create({
      data: {
        clientId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        title: data.title,
        isPrimary: data.isPrimary || false,
        notes: data.notes,
      },
    });
  }

  async updateContact(contactId: string, data: Partial<CreateContactData>, userId: string): Promise<void> {
    const contact = await prisma.clientContact.findUnique({
      where: { id: contactId },
      include: { client: true },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    // Check resource access
    const hasAccess = await rbacService.checkResourceAccess(userId, 'clients', contact.clientId, 'update');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    // If setting as primary, unset other primary contacts
    if (data.isPrimary) {
      await prisma.clientContact.updateMany({
        where: {
          clientId: contact.clientId,
          id: { not: contactId },
          isPrimary: true,
          deletedAt: null,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    await prisma.clientContact.update({
      where: { id: contactId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        title: data.title,
        isPrimary: data.isPrimary,
        notes: data.notes,
      },
    });
  }

  async deleteContact(contactId: string, userId: string): Promise<void> {
    const contact = await prisma.clientContact.findUnique({
      where: { id: contactId },
      include: { client: true },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    // Check resource access
    const hasAccess = await rbacService.checkResourceAccess(userId, 'clients', contact.clientId, 'update');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    await prisma.clientContact.update({
      where: { id: contactId },
      data: { deletedAt: new Date() },
    });
  }

  async getClientMetrics(clientId: string, userId: string): Promise<ReturnType<typeof clientsRepository.getMetrics>> {
    // Check resource access
    const hasAccess = await rbacService.checkResourceAccess(userId, 'clients', clientId, 'read');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    return clientsRepository.getMetrics(clientId);
  }
}

export const clientsService = new ClientsService();

