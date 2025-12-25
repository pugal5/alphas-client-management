# 🚀 Quick Deploy to Render - 5 Minutes

## What I've Prepared For You

✅ All configuration files ready
✅ Build scripts configured
✅ Environment variables template
✅ Database migration scripts
✅ Everything optimized for Render

---

## Step 1: Setup Git & Push to GitHub (2 minutes)

**Don't have Git setup yet?** See [SETUP_GIT.md](./SETUP_GIT.md) for detailed instructions.

**Quick version:**

1. **Create GitHub repo:**
   - Go to [github.com](https://github.com) → Click **"+"** → **"New repository"**
   - Name it: `alphas-client-management`
   - Click **"Create repository"**

2. **Push your code:**
   ```bash
   # Initialize git (if not done)
   git init
   git add .
   git commit -m "Initial commit - Ready for Render"

   # Connect to GitHub (replace YOUR_USERNAME)
   git remote add origin https://github.com/YOUR_USERNAME/alphas-client-management.git
   git branch -M main
   git push -u origin main
   ```

**Or use the automated script (Windows):**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-git.ps1
```

---

## Step 2: Deploy on Render (3 minutes)

### A. Create PostgreSQL Database

1. Go to [render.com](https://render.com) → Sign in
2. Click **"New +"** → **"PostgreSQL"**
3. Settings:
   - Name: `crm-postgres`
   - Database: `crm_db`
   - User: `crm_user`
   - Plan: **Free**
4. Click **"Create Database"**
5. **COPY** the **Internal Database URL** (looks like: `postgresql://crm_user:xxx@dpg-xxx/crm_db`)

### B. Create Redis

1. Click **"New +"** → **"Redis"**
2. Settings:
   - Name: `crm-redis`
   - Plan: **Free**
3. Click **"Create Redis"**
4. **COPY** the **Internal Redis URL**

### C. Create Backend Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub account → Select your repo
3. Settings:
   - **Name**: `crm-backend`
   - **Region**: Choose closest
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

4. **Environment Variables** (Click "Add Environment Variable"):
   
   Copy-paste these one by one:
   
   ```
   DATABASE_URL = [Paste Internal Database URL from Step A]
   REDIS_URL = [Paste Internal Redis URL from Step B]
   JWT_SECRET = [Generate: Use https://randomkeygen.com - copy a CodeIgniter Encryption Keys]
   JWT_REFRESH_SECRET = [Generate another random key]
   JWT_ACCESS_EXPIRES_IN = 15m
   JWT_REFRESH_EXPIRES_IN = 7d
   NODE_ENV = production
   API_PORT = 3001
   NEXT_PUBLIC_API_URL = https://crm-backend.onrender.com
   ```
   
   (You'll update NEXT_PUBLIC_API_URL after backend deploys)

5. Click **"Create Web Service"**
6. Wait 5-10 minutes for deployment
7. **COPY** your backend URL (e.g., `https://crm-backend-xxx.onrender.com`)

### D. Update Backend Environment Variable

1. Go back to backend service → **Environment**
2. Update `NEXT_PUBLIC_API_URL` to your actual backend URL
3. Save (will auto-redeploy)

### E. Create Frontend Service

1. Click **"New +"** → **"Web Service"**
2. Connect same GitHub repo
3. Settings:
   - **Name**: `crm-frontend`
   - **Root Directory**: `/` (leave empty or put `/`)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

4. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL = [Your backend URL from Step C]
   NODE_ENV = production
   ```

5. Click **"Create Web Service"**

### F. Run Database Migrations

1. Go to backend service → Click **"Shell"** tab
2. Run these commands:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

**OR** use Render's Manual Deploy → Run Command feature

---

## Step 3: Test Your App! 🎉

1. Go to your frontend URL: `https://crm-frontend-xxx.onrender.com`
2. Default login:
   - Email: `admin@crm.com`
   - Password: `admin123`

---

## That's It! ✅

Your CRM is now live on Render!

---

## Troubleshooting

**Backend won't start?**
- Check logs in Render dashboard
- Verify DATABASE_URL and REDIS_URL are correct
- Make sure you used **Internal** URLs (not public)

**Frontend can't connect?**
- Verify NEXT_PUBLIC_API_URL matches backend URL exactly
- Check backend is running (green status)

**Database errors?**
- Make sure migrations ran: `npm run db:migrate`
- Check DATABASE_URL format

**Need help?** Check the full guide in `RENDER_DEPLOY.md`

