import { Task, TaskStatus, TaskPriority, Prisma } from '@prisma/client';
import { tasksRepository, TaskFilters, TaskWithRelations } from './tasks.repository';
import { prisma } from '../lib/prisma';
import { rbacService } from '../rbac/rbac.service';
import { webSocketService } from '../websocket/websocket.service';
import { notificationsService } from '../notifications/notifications.service';

export interface CreateTaskData {
  campaignId?: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  startDate?: Date;
  estimatedHours?: number;
  assignedToId?: string;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {}

export interface AddDependencyData {
  dependsOnId: string;
  type?: string;
}

export class TasksService {
  async getTasks(filters: TaskFilters, userId: string): Promise<{ tasks: TaskWithRelations[]; total: number }> {
    const hasAccess = await rbacService.checkPermission(userId, 'tasks', 'read');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Filter by assignment if not admin/manager
    if (user?.role !== 'admin' && user?.role !== 'manager') {
      filters.assignedToId = userId;
    }

    return tasksRepository.findMany(filters);
  }

  async getTaskById(id: string, userId: string): Promise<TaskWithRelations> {
    const task = await tasksRepository.findById(id);
    if (!task) {
      throw new Error('Task not found');
    }

    const hasAccess = await rbacService.checkResourceAccess(userId, 'tasks', id, 'read');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    return task;
  }

  async createTask(data: CreateTaskData, userId: string): Promise<Task> {
    const hasAccess = await rbacService.checkPermission(userId, 'tasks', 'create');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const task = await tasksRepository.create({
      title: data.title,
      description: data.description,
      status: data.status || 'not_started',
      priority: data.priority || 'medium',
      dueDate: data.dueDate,
      startDate: data.startDate,
      estimatedHours: data.estimatedHours ? new Prisma.Decimal(data.estimatedHours) : null,
      campaign: data.campaignId ? {
        connect: { id: data.campaignId },
      } : undefined,
      creator: {
        connect: { id: userId },
      },
      assignedTo: data.assignedToId ? {
        connect: { id: data.assignedToId },
      } : undefined,
    });

    const activity = await prisma.activity.create({
      data: {
        type: 'task_created',
        title: `Task created: ${task.title}`,
        userId,
        taskId: task.id,
        campaignId: data.campaignId || undefined,
      },
    });

    // Emit WebSocket event
    webSocketService.emitTaskUpdated(task.id, { task });
    webSocketService.emitActivityAdded(activity);

    // Notify assignee if different from creator
    if (data.assignedToId && data.assignedToId !== userId) {
      await notificationsService.notifyTaskAssigned(data.assignedToId, {
        id: task.id,
        title: task.title,
      });
    }

    return task;
  }

  async updateTask(id: string, data: UpdateTaskData, userId: string): Promise<Task> {
    const hasAccess = await rbacService.checkResourceAccess(userId, 'tasks', id, 'update');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    const updateData: Prisma.TaskUpdateInput = {};
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority) updateData.priority = data.priority;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.estimatedHours !== undefined) {
      updateData.estimatedHours = data.estimatedHours ? new Prisma.Decimal(data.estimatedHours) : null;
    }
    if (data.assignedToId !== undefined) {
      updateData.assignedTo = data.assignedToId ? { connect: { id: data.assignedToId } } : { disconnect: true };
    }
    if (data.campaignId !== undefined) {
      updateData.campaign = data.campaignId ? { connect: { id: data.campaignId } } : { disconnect: true };
    }

    const task = await tasksRepository.update(id, updateData);

    await prisma.activity.create({
      data: {
        type: 'task_created',
        title: `Task updated: ${task.title}`,
        userId,
        taskId: task.id,
      },
    });

    return task;
  }

  async updateTaskStatus(id: string, status: TaskStatus, userId: string): Promise<Task> {
    const task = await tasksRepository.findById(id);
    if (!task) {
      throw new Error('Task not found');
    }

    const hasAccess = await rbacService.checkResourceAccess(userId, 'tasks', id, 'update');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    // Validate status transition
    if (!tasksRepository.canTransitionStatus(task.status, status)) {
      throw new Error(`Cannot transition from ${task.status} to ${status}`);
    }

    const updatedTask = await tasksRepository.updateStatus(id, status);

    const activity = await prisma.activity.create({
      data: {
        type: status === 'completed' ? 'task_completed' : 'task_created',
        title: `Task status changed: ${task.title} -> ${status}`,
        userId,
        taskId: task.id,
        metadata: {
          oldStatus: task.status,
          newStatus: status,
        },
      },
    });

    // Emit WebSocket event
    webSocketService.emitTaskUpdated(updatedTask.id, { task: updatedTask });
    webSocketService.emitActivityAdded(activity);

    // Notify assignee if different from updater
    if (updatedTask.assignedToId && updatedTask.assignedToId !== userId) {
      webSocketService.emitNotification(updatedTask.assignedToId, {
        type: 'task_updated',
        title: 'Task Updated',
        message: `Task "${updatedTask.title}" status changed to ${status}`,
        link: `/tasks/${updatedTask.id}`,
      });
    }

    return updatedTask;
  }

  async deleteTask(id: string, userId: string): Promise<void> {
    const hasAccess = await rbacService.checkResourceAccess(userId, 'tasks', id, 'delete');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    await tasksRepository.softDelete(id);
  }

  async addDependency(taskId: string, data: AddDependencyData, userId: string): Promise<void> {
    const hasAccess = await rbacService.checkResourceAccess(userId, 'tasks', taskId, 'update');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    await tasksRepository.addDependency(taskId, data.dependsOnId, data.type || 'finish_to_start');
  }

  async removeDependency(taskId: string, dependsOnId: string, userId: string): Promise<void> {
    const hasAccess = await rbacService.checkResourceAccess(userId, 'tasks', taskId, 'update');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    await tasksRepository.removeDependency(taskId, dependsOnId);
  }

  async getGanttData(campaignId: string | undefined, userId: string): Promise<ReturnType<typeof tasksRepository.getGanttData>> {
    const hasAccess = await rbacService.checkPermission(userId, 'tasks', 'read');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    return tasksRepository.getGanttData(campaignId);
  }

  async updateTimeTracking(taskId: string, actualHours: number, userId: string): Promise<Task> {
    const hasAccess = await rbacService.checkResourceAccess(userId, 'tasks', taskId, 'update');
    if (!hasAccess) {
      throw new Error('Insufficient permissions');
    }

    return tasksRepository.update(taskId, {
      actualHours: new Prisma.Decimal(actualHours),
    });
  }
}

export const tasksService = new TasksService();

