'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  type: 'social_media' | 'content_marketing' | 'email_marketing' | 'paid_advertising' | 'seo' | 'pr' | 'event' | 'other';
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
  description?: string;
  budget?: number;
  actualSpend?: number;
  startDate?: string;
  endDate?: string;
  kpiTarget?: string;
  kpiActual?: string;
  notes?: string;
  createdById: string;
  assignedToId?: string;
  client?: {
    id: string;
    name: string;
  };
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignData {
  clientId: string;
  name: string;
  type: Campaign['type'];
  status?: Campaign['status'];
  description?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  kpiTarget?: string;
  notes?: string;
  assignedToId?: string;
}

export interface UpdateCampaignData extends Partial<CreateCampaignData> {}

export interface CampaignFilters {
  status?: string;
  type?: string;
  clientId?: string;
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

export function useCampaigns(filters?: CampaignFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campaigns', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.clientId) params.append('clientId', filters.clientId);
      if (filters?.assignedToId) params.append('assignedToId', filters.assignedToId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await axios.get<{ campaigns: Campaign[]; total: number }>(
        `${API_URL}/api/campaigns?${params.toString()}`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!user,
  });
}

export function useCampaign(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const response = await axios.get<Campaign>(
        `${API_URL}/api/campaigns/${id}`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCampaignData) => {
      const response = await axios.post<{ campaign: Campaign }>(
        `${API_URL}/api/campaigns`,
        data,
        getAuthHeaders()
      );
      return response.data.campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({
        title: 'Success',
        description: 'Campaign created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create campaign',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCampaignData }) => {
      const response = await axios.put<{ campaign: Campaign }>(
        `${API_URL}/api/campaigns/${id}`,
        data,
        getAuthHeaders()
      );
      return response.data.campaign;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', data.id] });
      toast({
        title: 'Success',
        description: 'Campaign updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update campaign',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Campaign['status'] }) => {
      const response = await axios.put<{ campaign: Campaign }>(
        `${API_URL}/api/campaigns/${id}/status`,
        { status },
        getAuthHeaders()
      );
      return response.data.campaign;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', data.id] });
      toast({
        title: 'Success',
        description: 'Campaign status updated',
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

export function useUpdateCampaignKPI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, kpiActual }: { id: string; kpiActual: string }) => {
      const response = await axios.put<{ campaign: Campaign }>(
        `${API_URL}/api/campaigns/${id}/kpi`,
        { kpiActual },
        getAuthHeaders()
      );
      return response.data.campaign;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', data.id] });
      toast({
        title: 'Success',
        description: 'KPI updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update KPI',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_URL}/api/campaigns/${id}`, getAuthHeaders());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({
        title: 'Success',
        description: 'Campaign deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete campaign',
        variant: 'destructive',
      });
    },
  });
}

export function useCampaignMetrics(campaignId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campaign-metrics', campaignId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/api/campaigns/${campaignId}/metrics`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!user && !!campaignId,
  });
}

