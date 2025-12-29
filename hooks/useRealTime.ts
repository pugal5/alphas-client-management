'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';
import { toast } from './use-toast';

export function useRealTimeUpdates() {
  const { socket, connected } = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !connected) return;

    // Task updates
    socket.on('task:updated', (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', data.task?.id] });
      queryClient.invalidateQueries({ queryKey: ['gantt-data'] });
    });

    // Campaign updates
    socket.on('campaign:updated', (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', data.campaign?.id] });
    });

    // Client updates
    socket.on('client:updated', (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', data.client?.id] });
    });

    // Invoice updates
    socket.on('invoice:updated', (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', data.invoice?.id] });
    });

    // Activity updates
    socket.on('activity:added', (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    });

    // Notifications
    socket.on('notification', (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast({
        title: data.title || 'New Notification',
        description: data.message,
      });
    });

    return () => {
      socket.off('task:updated');
      socket.off('campaign:updated');
      socket.off('client:updated');
      socket.off('invoice:updated');
      socket.off('activity:added');
      socket.off('notification');
    };
  }, [socket, connected, queryClient]);
}
