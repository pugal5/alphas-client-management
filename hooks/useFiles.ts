'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface FileEntity {
  id: string;
  entityType: string;
  entityId: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'video' | 'audio' | 'other';
  size: number;
  mimeType: string;
  uploadedById: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface FileFilters {
  entityType?: string;
  entityId?: string;
  type?: string;
  search?: string;
}

function getAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export function useFiles(filters?: FileFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['files', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.entityType) params.append('entityType', filters.entityType);
      if (filters?.entityId) params.append('entityId', filters.entityId);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.search) params.append('search', filters.search);

      const response = await axios.get<{ files: FileEntity[] }>(
        `${API_URL}/api/files?${params.toString()}`,
        getAuthHeaders()
      );
      return response.data.files;
    },
    enabled: !!user,
  });
}

export function useFile(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['file', id],
    queryFn: async () => {
      const response = await axios.get<{ file: FileEntity }>(
        `${API_URL}/api/files/${id}`,
        getAuthHeaders()
      );
      return response.data.file;
    },
    enabled: !!user && !!id,
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, entityType, entityId }: { file: globalThis.File; entityType: string; entityId: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);

      const token = localStorage.getItem('accessToken');
      const response = await axios.post<{ file: FileEntity }>(
        `${API_URL}/api/files/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.file;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to upload file',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_URL}/api/files/${id}`, getAuthHeaders());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast({
        title: 'Success',
        description: 'File deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete file',
        variant: 'destructive',
      });
    },
  });
}

export function useDownloadFile() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.get(
        `${API_URL}/api/files/${id}/download`,
        {
          ...getAuthHeaders(),
          responseType: 'blob',
        }
      );
      return response.data;
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to download file',
        variant: 'destructive',
      });
    },
  });
}

