'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Client {
  id: string;
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
  status: 'active' | 'inactive' | 'prospect' | 'archived';
  contractValue?: number;
  contractStart?: string;
  contractEnd?: string;
  notes?: string;
  ownerId: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  contacts?: ClientContact[];
  _count?: {
    campaigns: number;
    invoices: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ClientContact {
  id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  isPrimary: boolean;
  notes?: string;
}

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
  status?: 'active' | 'inactive' | 'prospect' | 'archived';
  contractValue?: number;
  contractStart?: string;
  contractEnd?: string;
  notes?: string;
  ownerId: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {}

export interface ClientFilters {
  status?: string;
  ownerId?: string;
  industry?: string;
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

export function useClients(filters?: ClientFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['clients', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.ownerId) params.append('ownerId', filters.ownerId);
      if (filters?.industry) params.append('industry', filters.industry);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await axios.get<{ clients: Client[]; total: number }>(
        `${API_URL}/api/clients?${params.toString()}`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!user,
  });
}

export function useClient(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const response = await axios.get<Client>(
        `${API_URL}/api/clients/${id}`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateClientData) => {
      const response = await axios.post<{ client: Client }>(
        `${API_URL}/api/clients`,
        data,
        getAuthHeaders()
      );
      return response.data.client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Success',
        description: 'Client created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create client',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateClientData }) => {
      const response = await axios.put<{ client: Client }>(
        `${API_URL}/api/clients/${id}`,
        data,
        getAuthHeaders()
      );
      return response.data.client;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', data.id] });
      toast({
        title: 'Success',
        description: 'Client updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update client',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_URL}/api/clients/${id}`, getAuthHeaders());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Success',
        description: 'Client deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete client',
        variant: 'destructive',
      });
    },
  });
}

export function useAddContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, data }: { clientId: string; data: Partial<ClientContact> }) => {
      const response = await axios.post<{ contact: ClientContact }>(
        `${API_URL}/api/clients/${clientId}/contacts`,
        data,
        getAuthHeaders()
      );
      return response.data.contact;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientId] });
      toast({
        title: 'Success',
        description: 'Contact added successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add contact',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, contactId, data }: { clientId: string; contactId: string; data: Partial<ClientContact> }) => {
      const response = await axios.put<{ contact: ClientContact }>(
        `${API_URL}/api/clients/${clientId}/contacts/${contactId}`,
        data,
        getAuthHeaders()
      );
      return response.data.contact;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientId] });
      toast({
        title: 'Success',
        description: 'Contact updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update contact',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, contactId }: { clientId: string; contactId: string }) => {
      await axios.delete(
        `${API_URL}/api/clients/${clientId}/contacts/${contactId}`,
        getAuthHeaders()
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientId] });
      toast({
        title: 'Success',
        description: 'Contact deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete contact',
        variant: 'destructive',
      });
    },
  });
}

export function useClientMetrics(clientId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-metrics', clientId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/api/clients/${clientId}/metrics`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!user && !!clientId,
  });
}

