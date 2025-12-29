'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from './useAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export function useDashboardMetrics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/api/analytics/dashboard`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!user,
  });
}

export function useCampaignROI() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['analytics', 'campaign-roi'],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/api/analytics/campaign-roi`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!user,
  });
}

export function useTeamUtilization() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['analytics', 'team-utilization'],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/api/analytics/team-utilization`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!user,
  });
}

export function useTaskOnTimePercentage() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['analytics', 'task-on-time'],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/api/analytics/task-on-time`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!user,
  });
}

export function useClientProfitability() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['analytics', 'client-profitability'],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/api/analytics/client-profitability`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!user,
  });
}

export function useBudgetAccuracy() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['analytics', 'budget-accuracy'],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/api/analytics/budget-accuracy`,
        getAuthHeaders()
      );
      return response.data;
    },
    enabled: !!user,
  });
}

