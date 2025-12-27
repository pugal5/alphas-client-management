import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { hasPermission, Resource, Action } from './permissions.js';

export const requirePermission = (resource: Resource, action: Action) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!hasPermission(req.user.role, resource, action)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: { resource, action },
        userRole: req.user.role,
      });
      return;
    }

    next();
  };
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Insufficient role',
        required: roles,
        userRole: req.user.role,
      });
      return;
    }

    next();
  };
};

