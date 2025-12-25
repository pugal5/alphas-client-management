import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole, User } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { redisClient } from '../lib/redis';
import { JWTPayload, LoginRequest, RegisterRequest } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRES_IN,
    });
  }

  generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });
  }

  async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  async verifyRefreshToken(token: string): Promise<JWTPayload> {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  async storeRefreshToken(userId: string, token: string): Promise<void> {
    const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
    await redisClient.setEx(`refresh_token:${userId}`, expiresIn, token);
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    return redisClient.get(`refresh_token:${userId}`);
  }

  async removeRefreshToken(userId: string): Promise<void> {
    await redisClient.del(`refresh_token:${userId}`);
  }

  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    await redisClient.setEx(`blacklist:${token}`, expiresIn, '1');
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await redisClient.get(`blacklist:${token}`);
    return result === '1';
  }

  async register(data: RegisterRequest): Promise<User> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await this.hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || UserRole.team_member,
      },
    });

    return user;
  }

  async login(data: LoginRequest): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const isPasswordValid = await this.comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Store refresh token in Redis
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const payload = await this.verifyRefreshToken(refreshToken);

    // Check if token is blacklisted
    if (await this.isTokenBlacklisted(refreshToken)) {
      throw new Error('Token has been revoked');
    }

    // Verify token is stored in Redis
    const storedToken = await this.getRefreshToken(payload.userId);
    if (storedToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Generate new access token
    const newAccessToken = this.generateAccessToken(payload);

    return newAccessToken;
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    // Remove refresh token from Redis
    await this.removeRefreshToken(userId);

    // Blacklist the refresh token
    const payload = await this.verifyRefreshToken(refreshToken);
    const decoded = jwt.decode(refreshToken) as { exp?: number };
    if (decoded.exp) {
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      if (expiresIn > 0) {
        await this.blacklistToken(refreshToken, expiresIn);
      }
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  }
}

export const authService = new AuthService();

