import { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { LoginRequest, RegisterRequest } from '../types/auth.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['admin', 'manager', 'team_member', 'finance', 'client_viewer']).optional(),
});

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = registerSchema.parse(req.body);
      const user = await authService.register(validatedData as RegisterRequest);

      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = authService.generateAccessToken(payload);
      const refreshToken = authService.generateRefreshToken(payload);

      await authService.storeRefreshToken(user.id, refreshToken);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        accessToken,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { user, accessToken, refreshToken } = await authService.login(validatedData as LoginRequest);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        accessToken,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      res.status(401).json({ error: (error as Error).message });
    }
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.headers['x-refresh-token'];

      if (!refreshToken) {
        res.status(401).json({ error: 'Refresh token required' });
        return;
      }

      const accessToken = await authService.refreshAccessToken(refreshToken);

      res.json({ accessToken });
    } catch (error) {
      res.status(401).json({ error: (error as Error).message });
    }
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.headers['x-refresh-token'];

      if (refreshToken && req.user) {
        await authService.logout(req.user.userId, refreshToken);
      }

      res.clearCookie('refreshToken');
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const user = await authService.getUserById(req.user.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }
}

export const authController = new AuthController();

