 # 🚀 Setup Git & GitHub Repository

## Step 1: Initialize Git (if not done)

Open your terminal in the project folder and run:

```bash
git init
git add .
git commit -m "Initial commit - Alpha CRM ready for deployment"
```

## Step 2: Create GitHub Repository

### Option A: Using GitHub Website (Easiest)

1. Go to [github.com](https://github.com) and sign in
2. Click the **"+"** icon (top right) → **"New repository"**
3. Fill in:
   - **Repository name**: `alphas-client-management` (or any name you like)
   - **Description**: "Enterprise CRM for marketing/media companies"
   - **Visibility**: Choose **Public** (free) or **Private**
   - **DO NOT** check "Initialize with README" (we already have files)
4. Click **"Create repository"**

### Option B: Using GitHub CLI (if installed)

```bash
gh repo create alphas-client-management --public --source=. --remote=origin --push
```

## Step 3: Connect and Push

After creating the repo on GitHub, you'll see instructions. Use these commands:

```bash
# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/alphas-client-management.git

# Rename branch to main (if needed)
git branch -M main

# Push your code
git push -u origin main
```

**Example:**
If your GitHub username is `johndoe`, the command would be:
```bash
git remote add origin https://github.com/johndoe/alphas-client-management.git
```

## Step 4: Verify

1. Go to your GitHub profile
2. You should see your new repository
3. All your files should be there

## ✅ Done!

Now you can proceed with Render deployment using `QUICK_DEPLOY.md`

---

## Troubleshooting

### "Repository already exists" error
- You might have already created it
- Just use the existing repo URL

### "Authentication failed"
- You might need to use a Personal Access Token
- Go to GitHub → Settings → Developer settings → Personal access tokens
- Generate a token with `repo` permissions
- Use it as password when pushing

### "Remote origin already exists"
```bash
# Remove existing remote
git remote remove origin

# Add new one
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

