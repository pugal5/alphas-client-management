# ✅ Render Deployment Checklist

Use this checklist as you deploy:

## Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] GitHub repo is public (or Render has access)
- [ ] All files committed

## On Render.com

### Database Setup
- [ ] PostgreSQL database created
- [ ] Internal Database URL copied
- [ ] Redis instance created
- [ ] Internal Redis URL copied

### Backend Service
- [ ] Web service created
- [ ] Root directory set to `server`
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm start`
- [ ] DATABASE_URL environment variable set
- [ ] REDIS_URL environment variable set
- [ ] JWT_SECRET generated and set
- [ ] JWT_REFRESH_SECRET generated and set
- [ ] All other env vars set (see QUICK_DEPLOY.md)
- [ ] Backend deployed successfully
- [ ] Backend URL copied

### Frontend Service
- [ ] Web service created
- [ ] Root directory set to `/` (root)
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm start`
- [ ] NEXT_PUBLIC_API_URL set to backend URL
- [ ] Frontend deployed successfully

### Database Setup
- [ ] Migrations run: `npm run db:migrate`
- [ ] Database seeded: `npm run db:seed`

### Testing
- [ ] Backend health check works: `/health`
- [ ] Frontend loads
- [ ] Can login with admin@crm.com / admin123
- [ ] API calls work

## Post-Deployment
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic on Render)
- [ ] Monitoring set up (optional)

---

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

