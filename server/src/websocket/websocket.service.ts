import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { authService } from '../auth/auth.service.js';

export interface SocketUser {
  userId: string;
  email: string;
  role: string;
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const payload = await authService.verifyAccessToken(token);
        (socket as any).user = payload;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  private handleConnection(socket: Socket): void {
    const user = (socket as any).user as { userId: string; email: string; role: string };
    
    if (!user) {
      socket.disconnect();
      return;
    }

    // Track user connection
    if (!this.userSockets.has(user.userId)) {
      this.userSockets.set(user.userId, new Set());
    }
    this.userSockets.get(user.userId)!.add(socket.id);
    this.connectedUsers.set(socket.id, user);

    // Join user's personal room
    socket.join(`user:${user.userId}`);

    // Emit user online status
    this.emitToRoom(`user:${user.userId}`, 'user:online', { userId: user.userId, email: user.email });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket, user.userId);
    });

    // Handle room joins
    socket.on('join:room', (room: string) => {
      socket.join(room);
    });

    socket.on('leave:room', (room: string) => {
      socket.leave(room);
    });

    // Handle custom events
    socket.on('ping', () => {
      socket.emit('pong');
    });
  }

  private handleDisconnection(socket: Socket, userId: string): void {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        this.userSockets.delete(userId);
        // Emit user offline status
        this.emitToRoom(`user:${userId}`, 'user:offline', { userId });
      }
    }
    this.connectedUsers.delete(socket.id);
  }

  emitToUser(userId: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
  }

  emitToRoom(room: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(room).emit(event, data);
  }

  emitToAll(event: string, data: any): void {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  // Convenience methods for common events
  emitTaskUpdated(taskId: string, data: any): void {
    this.emitToAll('task:updated', { taskId, ...data });
  }

  emitCampaignUpdated(campaignId: string, data: any): void {
    this.emitToAll('campaign:updated', { campaignId, ...data });
  }

  emitClientUpdated(clientId: string, data: any): void {
    this.emitToAll('client:updated', { clientId, ...data });
  }

  emitInvoiceUpdated(invoiceId: string, data: any): void {
    this.emitToAll('invoice:updated', { invoiceId, ...data });
  }

  emitActivityAdded(activity: any): void {
    this.emitToAll('activity:added', activity);
  }

  emitNotification(userId: string, notification: any): void {
    this.emitToUser(userId, 'notification', notification);
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }
}

export const webSocketService = new WebSocketService();

