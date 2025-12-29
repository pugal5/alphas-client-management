'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Task {
  id: string;
  campaignId?: string;
  title: string;
  name?: string; // For backward compatibility
  description?: string;
  status: 'not_started' | 'in_progress' | 'under_review' | 'completed' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  assignedToId?: string;
  createdById: string;
  campaign?: {
    id: string;
    name: string;
  };
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  dependencies?: Array<{
    id: string;
    dependsOnId: string;
    dependsOn: {
      id: string;
      name: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskData {
  campaignId?: string;
  title: string;
  description?: string;
  status?: Task['status'];
  priority: Task['priority'];
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  assignedToId?: string;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {}

export interface TaskFilters {
  status?: string;
  priority?: string;
  campaignId?: string;
  assignedToId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

function getAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export function useTasks(filters?: TaskFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.campaignId) params.append('campaignId', filters.campaignId);
      if (filters?.assignedToId) params.append('assignedToId', filters.assignedToId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await axios.get<{ tasks: Task[]; total: number }>(
        `${API_URL}/api/tasks?${params.toString()}`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!user,
  });
}

export function useTask(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const response = await axios.get<Task>(
        `${API_URL}/api/tasks/${id}`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!user && !!id,
  });
}

export function useGanttData(campaignId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['gantt-data', campaignId],
    queryFn: async () => {
      const params = campaignId ? `?campaignId=${campaignId}` : '';
      const response = await axios.get<{ tasks: Task[] }>(
        `${API_URL}/api/tasks/gantt${params}`,
        getAuthHeaders()
      );
      return response.data.tasks;
    },
    enabled: !!user,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTaskData) => {
      const response = await axios.post<{ task: Task }>(
        `${API_URL}/api/tasks`,
        data,
        getAuthHeaders()
      );
      return response.data.task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['gantt-data'] });
      toast({
        title: 'Success',
        description: 'Task created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create task',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskData }) => {
      const response = await axios.put<{ task: Task }>(
        `${API_URL}/api/tasks/${id}`,
        data,
        getAuthHeaders()
      );
      return response.data.task;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', data.id] });
      queryClient.invalidateQueries({ queryKey: ['gantt-data'] });
      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update task',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Task['status'] }) => {
      const response = await axios.put<{ task: Task }>(
        `${API_URL}/api/tasks/${id}/status`,
        { status },
        getAuthHeaders()
      );
      return response.data.task;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', data.id] });
      queryClient.invalidateQueries({ queryKey: ['gantt-data'] });
      toast({
        title: 'Success',
        description: 'Task status updated',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update status',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateTimeTracking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, actualHours }: { id: string; actualHours: number }) => {
      const response = await axios.put<{ task: Task }>(
        `${API_URL}/api/tasks/${id}/time-tracking`,
        { actualHours },
        getAuthHeaders()
      );
      return response.data.task;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', data.id] });
      toast({
        title: 'Success',
        description: 'Time tracking updated',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update time tracking',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_URL}/api/tasks/${id}`, getAuthHeaders());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['gantt-data'] });
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete task',
        variant: 'destructive',
      });
    },
  });
}

export function useAddDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, dependsOnId }: { taskId: string; dependsOnId: string }) => {
      await axios.post(
        `${API_URL}/api/tasks/${taskId}/dependencies`,
        { dependsOnId },
        getAuthHeaders()
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['gantt-data'] });
      toast({
        title: 'Success',
        description: 'Dependency added',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add dependency',
        variant: 'destructive',
      });
    },
  });
}

export function useRemoveDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, dependencyId }: { taskId: string; dependencyId: string }) => {
      await axios.delete(
        `${API_URL}/api/tasks/${taskId}/dependencies/${dependencyId}`,
        getAuthHeaders()
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['gantt-data'] });
      toast({
        title: 'Success',
        description: 'Dependency removed',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to remove dependency',
        variant: 'destructive',
      });
    },
  });
}

