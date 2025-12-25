import { Socket } from 'socket.io';
import { authService } from '../auth/auth.service';

export async function authenticateSocket(socket: Socket, next: Function): Promise<void> {
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
}

