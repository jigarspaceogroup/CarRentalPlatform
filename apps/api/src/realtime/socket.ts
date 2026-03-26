import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

let io: Server | null = null;

interface AuthPayload {
  userId: string;
  type: 'customer' | 'staff';
  role?: string;
}

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
      credentials: true,
    },
  });

  // JWT authentication middleware
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as AuthPayload;

    // Join user-specific room
    socket.join(`user:${user.userId}`);

    // Staff members join staff room
    if (user.type === 'staff') {
      socket.join('staff:dashboard');
    }

    // Join booking-specific rooms
    socket.on('booking:subscribe', (bookingId: string) => {
      socket.join(`booking:${bookingId}`);
    });

    socket.on('booking:unsubscribe', (bookingId: string) => {
      socket.leave(`booking:${bookingId}`);
    });

    socket.on('disconnect', () => {
      // Cleanup handled automatically by Socket.io
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

// Emit helpers
export function emitBookingNew(booking: any) {
  if (!io) return;
  io.to('staff:dashboard').emit('booking:new', booking);
}

export function emitBookingStatusChanged(
  bookingId: string,
  data: {
    bookingId: string;
    status: string;
    previousStatus: string;
    updatedAt: string;
  },
) {
  if (!io) return;
  io.to(`booking:${bookingId}`).emit('booking:status-changed', data);
  io.to('staff:dashboard').emit('booking:status-changed', data);
}

export function emitOtpGenerated(
  userId: string,
  data: { bookingId: string; message: string },
) {
  if (!io) return;
  io.to(`user:${userId}`).emit('otp:generated', data);
}

export function emitDashboardRefresh() {
  if (!io) return;
  io.to('staff:dashboard').emit('dashboard:refresh', {
    timestamp: new Date().toISOString(),
  });
}

export function emitToUser(userId: string, event: string, data: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}
