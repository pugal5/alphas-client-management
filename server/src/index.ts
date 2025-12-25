import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { webSocketService } from './websocket/websocket.service';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.API_PORT || 3001;

// Initialize WebSocket
webSocketService.initialize(server);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
import authRoutes from './auth/auth.routes';
import clientsRoutes from './clients/clients.routes';
import campaignsRoutes from './campaigns/campaigns.routes';
import tasksRoutes from './tasks/tasks.routes';
import invoicesRoutes from './invoices/invoices.routes';
import expensesRoutes from './expenses/expenses.routes';
import notificationsRoutes from './notifications/notifications.routes';
import filesRoutes from './files/files.routes';
import analyticsRoutes from './analytics/analytics.routes';
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/analytics', analyticsRoutes);

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server initialized`);
});

