# Alpha CRM Setup Guide

## Quick Start

### 1. Prerequisites
- Node.js 20+
- Docker Desktop (Windows)
- npm or yarn

### 2. Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Key variables:
# - DATABASE_URL
# - REDIS_URL
# - JWT_SECRET
# - JWT_REFRESH_SECRET
```

### 4. Start Docker Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- Adminer (database UI) on port 8080

### 5. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### 6. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server && npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 7. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database UI: http://localhost:8080

## Default Credentials

After seeding:
- Email: `admin@crm.com`
- Password: `admin123`

## Project Structure

```
alphas-client-managemen/
├── app/                    # Next.js App Router pages
├── components/             # React components
├── lib/                    # Shared utilities
├── hooks/                  # React hooks
├── server/                 # Express.js backend
│   └── src/
│       ├── auth/          # Authentication
│       ├── clients/        # Client management
│       ├── campaigns/      # Campaign management
│       ├── tasks/          # Task management
│       ├── invoices/       # Invoice management
│       ├── expenses/       # Expense management
│       ├── files/          # File management
│       ├── notifications/  # Notification system
│       ├── analytics/      # Analytics & reporting
│       ├── websocket/      # WebSocket server
│       └── rbac/           # Role-based access control
├── prisma/                 # Prisma schema and migrations
└── docker-compose.yml      # Docker configuration
```

## Features Implemented

✅ Multi-user authentication with JWT
✅ Role-based access control (Admin, Manager, Team Member, Finance, Client Viewer)
✅ Client management with contacts
✅ Campaign management with KPIs and budgets
✅ Task management with Gantt chart support
✅ Invoice and expense tracking
✅ Real-time updates via WebSocket
✅ Notification system (in-app and email)
✅ Analytics and reporting
✅ File management with S3 integration
✅ Docker production setup
✅ CI/CD pipeline

## API Endpoints

All API endpoints are prefixed with `/api`:

- `/api/auth/*` - Authentication
- `/api/clients/*` - Client CRUD
- `/api/campaigns/*` - Campaign CRUD
- `/api/tasks/*` - Task CRUD
- `/api/invoices/*` - Invoice CRUD
- `/api/expenses/*` - Expense CRUD
- `/api/files/*` - File uploads
- `/api/notifications/*` - Notifications
- `/api/analytics/*` - Analytics

## Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

## Testing

```bash
# Run frontend tests
npm test

# Run backend tests
cd server && npm test
```

## Troubleshooting

1. **Database connection issues**: Ensure Docker containers are running
2. **Port conflicts**: Check if ports 3000, 3001, 5432, 6379 are available
3. **Prisma errors**: Run `npm run db:generate` after schema changes
4. **WebSocket issues**: Check CORS settings in server configuration

## Support

For issues or questions, refer to the main README.md file.

