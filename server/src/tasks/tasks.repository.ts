import { Prisma, Task, TaskStatus, TaskPriority } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  campaignId?: string;
  assignedToId?: string;
  createdById?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  search?: string;
  skip?: number;
  take?: number;
}

export interface TaskWithRelations extends Task {
  campaign: {
    id: string;
    name: string;
    client: {
      id: string;
      name: string;
    };
  } | null;
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  dependencies: Array<{
    id: string;
    dependsOnId: string;
    type: string;
    dependsOn: {
      id: string;
      title: string;
      status: TaskStatus;
    };
  }>;
  dependents: Array<{
    id: string;
    taskId: string;
    type: string;
    task: {
      id: string;
      title: string;
      status: TaskStatus;
    };
  }>;
}

const statusWorkflow: Record<TaskStatus, TaskStatus[]> = {
  not_started: ['in_progress', 'cancelled'],
  in_progress: ['under_review', 'completed', 'blocked', 'cancelled'],
  under_review: ['completed', 'in_progress', 'cancelled'],
  completed: [],
  blocked: ['in_progress', 'cancelled'],
  cancelled: [],
};

export class TasksRepository {
  async findMany(filters: TaskFilters): Promise<{ tasks: TaskWithRelations[]; total: number }> {
    const where: Prisma.TaskWhereInput = {
      deletedAt: null,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.campaignId) {
      where.campaignId = filters.campaignId;
    }

    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }

    if (filters.createdById) {
      where.createdById = filters.createdById;
    }

    if (filters.dueDateFrom || filters.dueDateTo) {
      where.dueDate = {};
      if (filters.dueDateFrom) {
        where.dueDate.gte = filters.dueDateFrom;
      }
      if (filters.dueDateTo) {
        where.dueDate.lte = filters.dueDateTo;
      }
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip: filters.skip,
        take: filters.take,
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              client: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          dependencies: {
            include: {
              dependsOn: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                },
              },
            },
          },
          dependents: {
            include: {
              task: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks: tasks as TaskWithRelations[],
      total,
    };
  }

  async findById(id: string): Promise<TaskWithRelations | null> {
    const task = await prisma.task.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        dependencies: {
          include: {
            dependsOn: {
              select: {
                id: true,
                title: true,
                status: true,
                dueDate: true,
                startDate: true,
              },
            },
          },
        },
        dependents: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                dueDate: true,
                startDate: true,
              },
            },
          },
        },
      },
    });

    return task as TaskWithRelations | null;
  }

  async create(data: Prisma.TaskCreateInput): Promise<Task> {
    return prisma.task.create({
      data,
    });
  }

  async update(id: string, data: Prisma.TaskUpdateInput): Promise<Task> {
    return prisma.task.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    const updateData: Prisma.TaskUpdateInput = {
      status,
    };

    if (status === 'completed') {
      updateData.completedDate = new Date();
    } else if (status === 'in_progress' && !updateData.startDate) {
      updateData.startDate = new Date();
    }

    return prisma.task.update({
      where: { id },
      data: updateData,
    });
  }

  async softDelete(id: string): Promise<Task> {
    return prisma.task.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'cancelled',
      },
    });
  }

  async addDependency(taskId: string, dependsOnId: string, type: string = 'finish_to_start'): Promise<void> {
    // Check for circular dependencies
    const wouldCreateCycle = await this.checkCircularDependency(taskId, dependsOnId);
    if (wouldCreateCycle) {
      throw new Error('Circular dependency detected');
    }

    await prisma.taskDependency.create({
      data: {
        taskId,
        dependsOnId,
        type,
      },
    });
  }

  async removeDependency(taskId: string, dependsOnId: string): Promise<void> {
    await prisma.taskDependency.deleteMany({
      where: {
        taskId,
        dependsOnId,
      },
    });
  }

  async checkCircularDependency(taskId: string, dependsOnId: string): Promise<boolean> {
    // If dependsOnId depends on taskId (directly or indirectly), it's a cycle
    const visited = new Set<string>();
    const queue = [dependsOnId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (currentId === taskId) {
        return true; // Cycle detected
      }
      if (visited.has(currentId)) {
        continue;
      }
      visited.add(currentId);

      const dependencies = await prisma.taskDependency.findMany({
        where: { taskId: currentId },
        select: { dependsOnId: true },
      });

      queue.push(...dependencies.map((d) => d.dependsOnId));
    }

    return false;
  }

  async getGanttData(campaignId?: string): Promise<Array<{
    id: string;
    title: string;
    start: Date;
    end: Date;
    progress: number;
    dependencies: string[];
  }>> {
    const where: Prisma.TaskWhereInput = {
      deletedAt: null,
    };

    if (campaignId) {
      where.campaignId = campaignId;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        dependencies: {
          select: {
            dependsOnId: true,
          },
        },
      },
    });

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      start: task.startDate || task.createdAt,
      end: task.dueDate || new Date(task.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
      progress: task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0,
      dependencies: task.dependencies.map((d) => d.dependsOnId),
    }));
  }

  canTransitionStatus(currentStatus: TaskStatus, newStatus: TaskStatus): boolean {
    const allowedStatuses = statusWorkflow[currentStatus];
    return allowedStatuses.includes(newStatus);
  }
}

export const tasksRepository = new TasksRepository();

