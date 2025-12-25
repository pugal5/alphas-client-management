import { UserRole } from '@prisma/client';

export type Resource = 'users' | 'clients' | 'campaigns' | 'tasks' | 'invoices' | 'expenses' | 'reports' | 'analytics';
export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';

export interface Permission {
  resource: Resource;
  action: Action;
}

// Permission matrix based on roles
const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    // Admin has all permissions
    { resource: 'users', action: 'manage' },
    { resource: 'clients', action: 'manage' },
    { resource: 'campaigns', action: 'manage' },
    { resource: 'tasks', action: 'manage' },
    { resource: 'invoices', action: 'manage' },
    { resource: 'expenses', action: 'manage' },
    { resource: 'reports', action: 'manage' },
    { resource: 'analytics', action: 'manage' },
  ],
  manager: [
    { resource: 'users', action: 'read' },
    { resource: 'clients', action: 'manage' },
    { resource: 'campaigns', action: 'manage' },
    { resource: 'tasks', action: 'manage' },
    { resource: 'invoices', action: 'read' },
    { resource: 'expenses', action: 'read' },
    { resource: 'reports', action: 'manage' },
    { resource: 'analytics', action: 'read' },
  ],
  team_member: [
    { resource: 'clients', action: 'read' },
    { resource: 'campaigns', action: 'read' },
    { resource: 'tasks', action: 'manage' },
    { resource: 'invoices', action: 'read' },
  ],
  finance: [
    { resource: 'clients', action: 'read' },
    { resource: 'campaigns', action: 'read' },
    { resource: 'invoices', action: 'manage' },
    { resource: 'expenses', action: 'manage' },
    { resource: 'reports', action: 'read' },
    { resource: 'analytics', action: 'read' },
  ],
  client_viewer: [
    { resource: 'clients', action: 'read' },
    { resource: 'campaigns', action: 'read' },
    { resource: 'invoices', action: 'read' },
  ],
};

export function hasPermission(
  role: UserRole,
  resource: Resource,
  action: Action
): boolean {
  const permissions = rolePermissions[role] || [];
  
  // Check for explicit 'manage' permission (grants all actions)
  if (permissions.some(p => p.resource === resource && p.action === 'manage')) {
    return true;
  }
  
  // Check for specific action permission
  return permissions.some(p => p.resource === resource && p.action === action);
}

export function getPermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

export function canAccessResource(role: UserRole, resource: Resource): boolean {
  const permissions = rolePermissions[role] || [];
  return permissions.some(p => p.resource === resource);
}

