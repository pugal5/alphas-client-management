import { Response } from 'express';
import { tasksService } from './tasks.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';

const createTaskSchema = z.object({
  campaignId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  estimatedHours: z.number().optional(),
  assignedToId: z.string().uuid().optional(),
});

const updateTaskSchema = createTaskSchema.partial();

const updateStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

const addDependencySchema = z.object({
  dependsOnId: z.string().uuid(),
  type: z.enum(['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish']).optional(),
});

const updateTimeTrackingSchema = z.object({
  actualHours: z.number().min(0),
});

export class TasksController {
  async getTasks(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const filters = {
        status: req.query.status as TaskStatus | undefined,
        priority: req.query.priority as TaskPriority | undefined,
        campaignId: req.query.campaignId as string | undefined,
        assignedToId: req.query.assignedToId as string | undefined,
        createdById: req.query.createdById as string | undefined,
        dueDateFrom: req.query.dueDateFrom ? new Date(req.query.dueDateFrom as string) : undefined,
        dueDateTo: req.query.dueDateTo ? new Date(req.query.dueDateTo as string) : undefined,
        search: req.query.search as string | undefined,
        skip: req.query.skip ? parseInt(req.query.skip as string) : undefined,
        take: req.query.take ? parseInt(req.query.take as string) : undefined,
      };

      const result = await tasksService.getTasks(filters, req.user.userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getTaskById(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const task = await tasksService.getTaskById(req.params.id, req.user.userId);
      res.json(task);
    } catch (error) {
      if ((error as Error).message === 'Task not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(403).json({ error: (error as Error).message });
    }
  }

  async createTask(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = createTaskSchema.parse(req.body);
      const task = await tasksService.createTask(
        {
          ...validatedData,
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
          startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        },
        req.user.userId
      );
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async updateTask(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = updateTaskSchema.parse(req.body);
      const task = await tasksService.updateTask(
        req.params.id,
        {
          ...validatedData,
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
          startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        },
        req.user.userId
      );
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { status } = updateStatusSchema.parse(req.body);
      const task = await tasksService.updateTaskStatus(req.params.id, status, req.user.userId);
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async deleteTask(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      await tasksService.deleteTask(req.params.id, req.user.userId);
      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async addDependency(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = addDependencySchema.parse(req.body);
      await tasksService.addDependency(req.params.id, validatedData, req.user.userId);
      res.status(201).json({ message: 'Dependency added successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async removeDependency(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      await tasksService.removeDependency(req.params.id, req.params.dependsOnId, req.user.userId);
      res.json({ message: 'Dependency removed successfully' });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async getGanttData(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const campaignId = req.query.campaignId as string | undefined;
      const data = await tasksService.getGanttData(campaignId, req.user.userId);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async updateTimeTracking(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { actualHours } = updateTimeTrackingSchema.parse(req.body);
      const task = await tasksService.updateTimeTracking(req.params.id, actualHours, req.user.userId);
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export const tasksController = new TasksController();

