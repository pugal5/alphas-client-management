# Deploy to Render.com - Step by Step Guide

## Prerequisites
- GitHub account
- Render.com account (free tier available)
- Your code pushed to GitHub

---

## Step 1: Push Code to GitHub

If you haven't already:

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit - Ready for Render deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/yourusername/alphas-client-managemen.git
git branch -M main
git push -u origin main
```

---

## Step 2: Create PostgreSQL Database on Render

1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `crm-postgres` (or any name)
   - **Database**: `crm_db`
   - **User**: `crm_user` (or auto-generated)
   - **Region**: Choose closest to you
   - **Plan**: Free tier is fine for testing
4. Click **"Create Database"**
5. **IMPORTANT**: Copy the **Internal Database URL** (you'll need this)

---

## Step 3: Create Redis Instance on Render

1. Click **"New +"** → **"Redis"**
2. Configure:
   - **Name**: `crm-redis`
   - **Region**: Same as PostgreSQL
   - **Plan**: Free tier
3. Click **"Create Redis"**
4. Copy the **Internal Redis URL**

---

## Step 4: Create Backend Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure the backend:

   **Basic Settings:**
   - **Name**: `crm-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

   **Environment Variables:**
   Add these (click "Add Environment Variable"):
   ```
   DATABASE_URL = [Internal Database URL from Step 2]
   REDIS_URL = [Internal Redis URL from Step 3]
   JWT_SECRET = [Generate: openssl rand -base64 32]
   JWT_REFRESH_SECRET = [Generate: openssl rand -base64 32]
   JWT_ACCESS_EXPIRES_IN = 15m
   JWT_REFRESH_EXPIRES_IN = 7d
   NODE_ENV = production
   API_PORT = 3001
   NEXT_PUBLIC_API_URL = https://crm-backend.onrender.com
   SMTP_HOST = smtp.gmail.com
   SMTP_PORT = 587
   SMTP_USER = your-email@gmail.com
   SMTP_PASSWORD = your-app-password
   SMTP_FROM = noreply@yourdomain.com
   ```

4. Click **"Create Web Service"**
5. Wait for deployment (5-10 minutes)

---

## Step 5: Create Frontend Static Site

1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure:

   **Basic Settings:**
   - **Name**: `crm-frontend`
   - **Branch**: `main`
   - **Root Directory**: `/` (root)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `.next`

   **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL = https://crm-backend.onrender.com
   NODE_ENV = production
   ```

4. Click **"Create Static Site"**

**Note**: If Static Site doesn't work, use **Web Service** instead:
   - **Root Directory**: `/` (root)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

---

## Step 6: Update Backend URL in Frontend

After backend deploys, get its URL (e.g., `https://crm-backend.onrender.com`)

1. Go to Frontend service settings
2. Update environment variable:
   ```
   NEXT_PUBLIC_API_URL = https://crm-backend.onrender.com
   ```
3. Save and redeploy

---

## Step 7: Run Database Migrations

After backend is deployed:

1. Go to your backend service on Render
2. Click **"Shell"** tab (or use Render Shell)
3. Run:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

**Alternative**: Add a one-time job:
1. Click **"New +"** → **"Background Worker"**
2. Connect same repo
3. **Root Directory**: `server`
4. **Start Command**: `npm run db:migrate && npm run db:seed`
5. Run once, then delete

---

## Step 8: Access Your Application

- **Frontend**: `https://crm-frontend.onrender.com`
- **Backend API**: `https://crm-backend.onrender.com`
- **Health Check**: `https://crm-backend.onrender.com/health`

---

## Step 9: Configure CORS (Important!)

In your backend service on Render:

1. Go to **Settings** → **Headers**
2. Add custom headers:
   ```
   Access-Control-Allow-Origin: https://crm-frontend.onrender.com
   Access-Control-Allow-Credentials: true
   ```

Or update `server/src/index.ts` CORS config to include your frontend URL.

---

## Environment Variables Summary

### Backend Service:
```env
DATABASE_URL=[from PostgreSQL service]
REDIS_URL=[from Redis service]
JWT_SECRET=[random 32 char string]
JWT_REFRESH_SECRET=[random 32 char string]
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=production
API_PORT=3001
NEXT_PUBLIC_API_URL=https://crm-backend.onrender.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

### Frontend Service:
```env
NEXT_PUBLIC_API_URL=https://crm-backend.onrender.com
NODE_ENV=production
```

---

## Render-Specific Files

Create these files in your repo:

### `render.yaml` (Optional - for Infrastructure as Code)

```yaml
services:
  - type: web
    name: crm-backend
    env: node
    buildCommand: cd server && npm install && npm run build
    startCommand: cd server && npm start
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: crm-postgres
          property: connectionString
      - key: REDIS_URL
        fromService:
          name: crm-redis
          type: redis
          property: connectionString
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true

  - type: web
    name: crm-frontend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NEXT_PUBLIC_API_URL
        fromService:
          name: crm-backend
          type: web
          property: host

databases:
  - name: crm-postgres
    databaseName: crm_db
    user: crm_user

redis:
  - name: crm-redis
```

---

## Troubleshooting

### Backend won't start
- Check logs in Render dashboard
- Verify DATABASE_URL and REDIS_URL are correct
- Ensure build command completes successfully
- Check that port 3001 is exposed

### Frontend can't connect to backend
- Verify NEXT_PUBLIC_API_URL matches backend URL
- Check CORS settings
- Ensure backend is deployed and running

### Database connection errors
- Use **Internal Database URL** (not public URL)
- Verify database is running
- Check DATABASE_URL format

### Build fails
- Check Node version (should be 20+)
- Verify all dependencies in package.json
- Check build logs for specific errors

### Services keep sleeping (Free Tier)
- Free tier services sleep after 15 min inactivity
- First request after sleep takes ~30 seconds
- Upgrade to paid plan to avoid sleeping

---

## Cost Estimate (Free Tier)

- PostgreSQL: Free (limited to 90 days, then $7/month)
- Redis: Free (limited, then $10/month)
- Web Services: Free (sleeps after inactivity)
- Static Site: Free

**Total**: Free for testing, ~$17/month for always-on production

---

## Next Steps After Deployment

1. ✅ Test login with default credentials (admin@crm.com / admin123)
2. ✅ Verify all API endpoints work
3. ✅ Test file uploads (if S3 configured)
4. ✅ Set up custom domain (optional)
5. ✅ Configure SSL/HTTPS (automatic on Render)
6. ✅ Set up monitoring/alerts

---

## Quick Deploy Checklist

- [ ] Code pushed to GitHub
- [ ] PostgreSQL database created
- [ ] Redis instance created
- [ ] Backend service deployed
- [ ] Frontend service deployed
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] CORS configured
- [ ] Application tested

---

## Need Help?

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Check service logs in Render dashboard

