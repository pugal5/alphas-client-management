import { Request, Response } from 'express';
import { clientsService } from './clients.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';
import { ClientStatus } from '@prisma/client';

const createClientSchema = z.object({
  name: z.string().min(1),
  industry: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  status: z.nativeEnum(ClientStatus).optional(),
  contractValue: z.number().optional(),
  contractStart: z.string().datetime().optional(),
  contractEnd: z.string().datetime().optional(),
  notes: z.string().optional(),
  ownerId: z.string().uuid(),
});

const updateClientSchema = createClientSchema.partial();

const createContactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  title: z.string().optional(),
  isPrimary: z.boolean().optional(),
  notes: z.string().optional(),
});

export class ClientsController {
  async getClients(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const filters = {
        status: req.query.status as ClientStatus | undefined,
        ownerId: req.query.ownerId as string | undefined,
        industry: req.query.industry as string | undefined,
        search: req.query.search as string | undefined,
        skip: req.query.skip ? parseInt(req.query.skip as string) : undefined,
        take: req.query.take ? parseInt(req.query.take as string) : undefined,
      };

      const result = await clientsService.getClients(filters, req.user.userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getClientById(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const client = await clientsService.getClientById(req.params.id, req.user.userId);
      res.json(client);
    } catch (error) {
      if ((error as Error).message === 'Client not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      if ((error as Error).message === 'Insufficient permissions') {
        res.status(403).json({ error: (error as Error).message });
        return;
      }
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async createClient(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = createClientSchema.parse(req.body);
      const client = await clientsService.createClient(
        {
          ...validatedData,
          contractStart: validatedData.contractStart ? new Date(validatedData.contractStart) : undefined,
          contractEnd: validatedData.contractEnd ? new Date(validatedData.contractEnd) : undefined,
        },
        req.user.userId
      );
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async updateClient(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = updateClientSchema.parse(req.body);
      const client = await clientsService.updateClient(
        req.params.id,
        {
          ...validatedData,
          contractStart: validatedData.contractStart ? new Date(validatedData.contractStart) : undefined,
          contractEnd: validatedData.contractEnd ? new Date(validatedData.contractEnd) : undefined,
        },
        req.user.userId
      );
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      if ((error as Error).message === 'Client not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async deleteClient(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      await clientsService.deleteClient(req.params.id, req.user.userId);
      res.json({ message: 'Client deleted successfully' });
    } catch (error) {
      if ((error as Error).message === 'Client not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async addContact(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = createContactSchema.parse(req.body);
      await clientsService.addContact(req.params.id, validatedData, req.user.userId);
      res.status(201).json({ message: 'Contact added successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async updateContact(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = createContactSchema.partial().parse(req.body);
      await clientsService.updateContact(req.params.contactId, validatedData, req.user.userId);
      res.json({ message: 'Contact updated successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async deleteContact(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      await clientsService.deleteContact(req.params.contactId, req.user.userId);
      res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async getClientMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const metrics = await clientsService.getClientMetrics(req.params.id, req.user.userId);
      res.json(metrics);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export const clientsController = new ClientsController();

