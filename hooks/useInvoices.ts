'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Invoice {
  id: string;
  clientId: string;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  amount: number;
  taxAmount?: number;
  totalAmount: number;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'overdue' | 'refunded';
  notes?: string;
  createdById: string;
  client?: {
    id: string;
    name: string;
  };
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceData {
  clientId: string;
  amount: number;
  taxAmount?: number;
  issueDate: string;
  dueDate: string;
  notes?: string;
}

export interface UpdateInvoiceData extends Partial<CreateInvoiceData> {}

export interface InvoiceFilters {
  status?: string;
  paymentStatus?: string;
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

export function useInvoices(filters?: InvoiceFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
      if (filters?.clientId) params.append('clientId', filters.clientId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await axios.get<{ invoices: Invoice[]; total: number }>(
        `${API_URL}/api/invoices?${params.toString()}`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!user,
  });
}

export function useInvoice(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await axios.get<Invoice>(
        `${API_URL}/api/invoices/${id}`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!user && !!id,
  });
}

export function useOverdueInvoices() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['invoices', 'overdue'],
    queryFn: async () => {
      const response = await axios.get<{ invoices: Invoice[] }>(
        `${API_URL}/api/invoices/overdue`,
        getAuthHeaders()
      );
      return response.data.invoices;
    },
    enabled: !!user,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInvoiceData) => {
      const response = await axios.post<{ invoice: Invoice }>(
        `${API_URL}/api/invoices`,
        data,
        getAuthHeaders()
      );
      return response.data.invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Success',
        description: 'Invoice created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create invoice',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInvoiceData }) => {
      const response = await axios.put<{ invoice: Invoice }>(
        `${API_URL}/api/invoices/${id}`,
        data,
        getAuthHeaders()
      );
      return response.data.invoice;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', data.id] });
      toast({
        title: 'Success',
        description: 'Invoice updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update invoice',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, paymentStatus }: { id: string; paymentStatus: Invoice['paymentStatus'] }) => {
      const response = await axios.put<{ invoice: Invoice }>(
        `${API_URL}/api/invoices/${id}/payment-status`,
        { paymentStatus },
        getAuthHeaders()
      );
      return response.data.invoice;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', data.id] });
      toast({
        title: 'Success',
        description: 'Payment status updated',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update payment status',
        variant: 'destructive',
      });
    },
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axios.post(
        `${API_URL}/api/invoices/${id}/send`,
        {},
        getAuthHeaders()
      );
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      toast({
        title: 'Success',
        description: 'Invoice sent successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to send invoice',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_URL}/api/invoices/${id}`, getAuthHeaders());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Success',
        description: 'Invoice deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete invoice',
        variant: 'destructive',
      });
    },
  });
}

