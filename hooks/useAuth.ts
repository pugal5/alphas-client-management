'use client';

import { useState, useEffect, useCallback } from 'react';
import { authClient, User } from '@/lib/auth';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      if (authClient.isAuthenticated()) {
        const currentUser = await authClient.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      authClient.setAccessToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authClient.login(email, password);
    setUser(response.user);
  }, []);

  const register = useCallback(async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) => {
    const response = await authClient.register(data);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    await authClient.logout();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    await authClient.refreshToken();
    await loadUser();
  }, [loadUser]);

  return {
    user,
    loading,
    login,
    register,
    logout,
    refresh,
    isAuthenticated: !!user,
  };
}

