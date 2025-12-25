# Alpha Client Management CRM

Enterprise CRM system for marketing/media companies built with Next.js 14, Express.js, PostgreSQL, and Redis.

## 🚀 Quick Deploy to Render

**Want to deploy immediately?** Follow the [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) guide - it takes 5 minutes!

## 📋 What's Included

- ✅ Multi-user authentication with JWT
- ✅ Role-based access control (5 roles)
- ✅ Client management with contacts
- ✅ Campaign management with KPIs
- ✅ Task management with Gantt support
- ✅ Invoice and expense tracking
- ✅ Real-time updates via WebSocket
- ✅ Notification system
- ✅ Analytics and reporting
- ✅ File management

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Cache**: Redis
- **Real-time**: Socket.io
- **Deployment**: Render.com ready

## 📚 Documentation

- **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** - 5-minute Render deployment guide
- **[RENDER_DEPLOY.md](./RENDER_DEPLOY.md)** - Detailed Render deployment
- **[SETUP.md](./SETUP.md)** - Local development setup
- **[DEPLOY.md](./DEPLOY.md)** - General deployment options

## 🏃 Quick Start (Local)

```bash
# 1. Install dependencies
npm install
cd server && npm install && cd ..

# 2. Start Docker services
docker-compose up -d

# 3. Setup database
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. Start servers
# Terminal 1:
cd server && npm run dev

# Terminal 2:
npm run dev
```

Visit http://localhost:3000

**Default Login:**
- Email: `admin@crm.com`
- Password: `admin123`

## 📦 Project Structure

```
alphas-client-managemen/
├── app/                    # Next.js pages
├── components/             # React components
├── server/                 # Express.js backend
│   └── src/
│       ├── auth/          # Authentication
│       ├── clients/        # Client management
│       ├── campaigns/      # Campaign management
│       ├── tasks/          # Task management
│       ├── invoices/       # Invoice management
│       ├── expenses/       # Expense management
│       ├── files/          # File management
│       ├── notifications/  # Notifications
│       ├── analytics/      # Analytics
│       └── websocket/      # WebSocket server
├── prisma/                 # Database schema
└── docker-compose.yml      # Docker config
```

## 🔑 API Endpoints

All endpoints prefixed with `/api`:

- `/api/auth/*` - Authentication
- `/api/clients/*` - Client CRUD
- `/api/campaigns/*` - Campaign CRUD
- `/api/tasks/*` - Task CRUD
- `/api/invoices/*` - Invoice CRUD
- `/api/expenses/*` - Expense CRUD
- `/api/files/*` - File uploads
- `/api/notifications/*` - Notifications
- `/api/analytics/*` - Analytics

## 🧪 Testing

```bash
# Frontend tests
npm test

# Backend tests
cd server && npm test
```

## 📝 License

Private - All rights reserved

## 🤝 Support

For deployment help, see:
- [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for Render
- [RENDER_DEPLOY.md](./RENDER_DEPLOY.md) for detailed steps
- [DEPLOY.md](./DEPLOY.md) for other platforms
