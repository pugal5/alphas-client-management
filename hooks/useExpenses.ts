'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Expense {
  id: string;
  campaignId?: string;
  clientId?: string;
  description: string;
  amount: number;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  expenseDate: string;
  receiptUrl?: string;
  notes?: string;
  createdById: string;
  approvedById?: string;
  campaign?: {
    id: string;
    name: string;
  };
  client?: {
    id: string;
    name: string;
  };
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseData {
  campaignId?: string;
  clientId?: string;
  description: string;
  amount: number;
  category: string;
  expenseDate: string;
  receiptUrl?: string;
  notes?: string;
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {}

export interface ExpenseFilters {
  status?: string;
  category?: string;
  campaignId?: string;
  clientId?: string;
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

export function useExpenses(filters?: ExpenseFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.campaignId) params.append('campaignId', filters.campaignId);
      if (filters?.clientId) params.append('clientId', filters.clientId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await axios.get<{ expenses: Expense[]; total: number }>(
        `${API_URL}/api/expenses?${params.toString()}`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!user,
  });
}

export function useExpense(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['expense', id],
    queryFn: async () => {
      const response = await axios.get<Expense>(
        `${API_URL}/api/expenses/${id}`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateExpenseData) => {
      const response = await axios.post<{ expense: Expense }>(
        `${API_URL}/api/expenses`,
        data,
        getAuthHeaders()
      );
      return response.data.expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: 'Success',
        description: 'Expense created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create expense',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateExpenseData }) => {
      const response = await axios.put<{ expense: Expense }>(
        `${API_URL}/api/expenses/${id}`,
        data,
        getAuthHeaders()
      );
      return response.data.expense;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', data.id] });
      toast({
        title: 'Success',
        description: 'Expense updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update expense',
        variant: 'destructive',
      });
    },
  });
}

export function useApproveExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.post<{ expense: Expense }>(
        `${API_URL}/api/expenses/${id}/approve`,
        {},
        getAuthHeaders()
      );
      return response.data.expense;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', data.id] });
      toast({
        title: 'Success',
        description: 'Expense approved',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to approve expense',
        variant: 'destructive',
      });
    },
  });
}

export function useRejectExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await axios.post<{ expense: Expense }>(
        `${API_URL}/api/expenses/${id}/reject`,
        { reason },
        getAuthHeaders()
      );
      return response.data.expense;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', data.id] });
      toast({
        title: 'Success',
        description: 'Expense rejected',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to reject expense',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_URL}/api/expenses/${id}`, getAuthHeaders());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: 'Success',
        description: 'Expense deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete expense',
        variant: 'destructive',
      });
    },
  });
}

