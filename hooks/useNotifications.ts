'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  taskAssigned: boolean;
  taskCompleted: boolean;
  campaignUpdated: boolean;
  invoiceSent: boolean;
  paymentReceived: boolean;
}

function getAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export function useNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await axios.get<{ notifications: Notification[] }>(
        `${API_URL}/api/notifications`,
        getAuthHeaders()
      );
      return response.data.notifications;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useUnreadCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await axios.get<{ count: number }>(
        `${API_URL}/api/notifications/unread-count`,
        getAuthHeaders()
      );
      return response.data.count;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axios.put(
        `${API_URL}/api/notifications/${id}/read`,
        {},
        getAuthHeaders()
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await axios.put(
        `${API_URL}/api/notifications/read-all`,
        {},
        getAuthHeaders()
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    },
  });
}

export function useNotificationPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: async () => {
      const response = await axios.get<{ preferences: NotificationPreferences }>(
        `${API_URL}/api/notifications/preferences`,
        getAuthHeaders()
      );
      return response.data.preferences;
    },
    enabled: !!user,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>) => {
      const response = await axios.put<{ preferences: NotificationPreferences }>(
        `${API_URL}/api/notifications/preferences`,
        preferences,
        getAuthHeaders()
      );
      return response.data.preferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'preferences'] });
      toast({
        title: 'Success',
        description: 'Notification preferences updated',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update preferences',
        variant: 'destructive',
      });
    },
  });
}

