# Deployment Guide

## Option 1: Deploy to VPS/Remote Server (Ubuntu/Debian)

### Prerequisites
- Remote server with Ubuntu 20.04+ or Debian 11+
- SSH access
- Docker and Docker Compose installed on server

### Step 1: Install Docker on Remote Server

```bash
# SSH into your server
ssh user@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add your user to docker group
sudo usermod -aG docker $USER
```

### Step 2: Upload Project to Server

**Option A: Using Git (Recommended)**
```bash
# On your local machine, push to GitHub/GitLab
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main

# On server
git clone your-repo-url
cd alphas-client-managemen
```

**Option B: Using SCP**
```bash
# From your local machine
scp -r . user@your-server-ip:/path/to/alphas-client-managemen
```

### Step 3: Setup Environment Variables

```bash
# On server
cd alphas-client-managemen
cp .env.example .env
nano .env  # Edit with your production values
```

**Important environment variables:**
```env
DATABASE_URL=postgresql://crm_user:STRONG_PASSWORD@postgres:5432/crm_db
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
NEXT_PUBLIC_API_URL=http://your-server-ip:3001
NODE_ENV=production
```

### Step 4: Deploy with Docker

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate

# Seed database (optional)
docker-compose -f docker-compose.prod.yml exec backend npm run db:seed
```

### Step 5: Setup Nginx Reverse Proxy (Optional but Recommended)

```bash
# Install Nginx
sudo apt update
sudo apt install nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/crm
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Option 2: Deploy to Cloud Platforms

### Railway.app (Easiest)

1. Go to [railway.app](https://railway.app)
2. Create new project
3. Connect your GitHub repo
4. Add services:
   - PostgreSQL database
   - Redis
   - Backend (Node.js)
   - Frontend (Next.js)
5. Set environment variables
6. Deploy!

### Render.com

1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repo
4. Select Docker
5. Add PostgreSQL and Redis services
6. Set environment variables
7. Deploy!

### DigitalOcean App Platform

1. Go to DigitalOcean App Platform
2. Create new app from GitHub
3. Add PostgreSQL and Redis databases
4. Configure build settings
5. Set environment variables
6. Deploy!

### AWS EC2 + Docker

Follow Option 1 above, but use AWS EC2 instance instead of VPS.

---

## Option 3: Quick Deploy Script

Create this script on your server:

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Starting deployment..."

# Pull latest code
git pull origin main

# Build and restart containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker-compose -f docker-compose.prod.yml exec -T backend npm run db:migrate

echo "✅ Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Environment Variables for Production

Create `.env` file on server:

```env
# Database
DATABASE_URL=postgresql://crm_user:STRONG_PASSWORD@postgres:5432/crm_db?schema=public

# Redis
REDIS_URL=redis://redis:6379

# JWT Secrets (GENERATE STRONG RANDOM STRINGS!)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API Configuration
NEXT_PUBLIC_API_URL=https://your-domain.com/api
API_PORT=3001
NODE_ENV=production

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Application
APP_URL=https://your-domain.com
APP_NAME=Alpha CRM
```

---

## Monitoring & Maintenance

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Restart Services
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Update Application
```bash
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

### Backup Database
```bash
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U crm_user crm_db > backup.sql
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS (SSL certificate)
- [ ] Configure firewall (only allow ports 80, 443, 22)
- [ ] Set up regular database backups
- [ ] Enable rate limiting
- [ ] Review and restrict CORS settings
- [ ] Set up monitoring/alerting

---

## Troubleshooting

### Can't connect to database
- Check DATABASE_URL in .env
- Verify postgres container is running: `docker ps`
- Check logs: `docker-compose logs postgres`

### Port already in use
- Change ports in docker-compose.prod.yml
- Or stop conflicting services

### Build fails
- Check Dockerfile syntax
- Verify all dependencies in package.json
- Check build logs: `docker-compose logs`

