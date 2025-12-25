'use client';

import { useAuth } from './useAuth';
import { hasPermission, canAccessResource, Resource, Action } from '@/lib/permissions';
import { UserRole } from '@prisma/client';

export function usePermission() {
  const { user } = useAuth();

  const checkPermission = (resource: Resource, action: Action): boolean => {
    if (!user) return false;
    return hasPermission(user.role as UserRole, resource, action);
  };

  const checkResourceAccess = (resource: Resource): boolean => {
    if (!user) return false;
    return canAccessResource(user.role as UserRole, resource);
  };

  const requirePermission = (resource: Resource, action: Action): boolean => {
    return checkPermission(resource, action);
  };

  return {
    checkPermission,
    checkResourceAccess,
    requirePermission,
    userRole: user?.role,
  };
}

