# Deploy AfriClaw to GitHub

## Prerequisites
- GitHub account (create at github.com)
- Git installed on your computer
- Your AfriClaw project files

## Step-by-Step Guide

### Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click "+" icon (top right) → "New repository"
3. Fill in:
   - **Repository name:** `africlaw` (or your preferred name)
   - **Description:** "Africa's AI WhatsApp Assistant - Powered by Claude"
   - **Visibility:** Public (or Private if you prefer)
   - **Add .gitignore:** Select "Node"
   - **Add LICENSE:** Select "MIT" (recommended)
4. Click "Create repository"
5. Copy your repository URL (looks like: `https://github.com/yourusername/africlaw.git`)

### Step 2: Initialize Git Locally

Open terminal/command prompt in your AfriClaw project directory:

```bash
# Navigate to project
cd /path/to/africlaw

# Initialize git
git init

# Add GitHub as remote
git remote add origin https://github.com/yourusername/africlaw.git

# Set main branch
git branch -M main
```

### Step 3: Configure Git (First Time Only)

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 4: Prepare Files for Upload

Before uploading, ensure .env is NOT committed (it's already in .gitignore):

```bash
# Verify .gitignore includes .env
cat .gitignore | grep "^\.env"

# Create .env.example if not exists (template without secrets)
cp .env .env.example

# Edit .env.example and replace credentials with placeholders
# Example:
# TWILIO_ACCOUNT_SID=your_account_sid_here
# TWILIO_AUTH_TOKEN=your_auth_token_here
```

### Step 5: Add and Commit Files

```bash
# Add all files
git add .

# Check what will be committed
git status

# Commit
git commit -m "Initial commit: AfriClaw WhatsApp AI Bot

- Complete Express.js backend with Twilio integration
- Claude AI integration for intelligent responses
- Firebase Firestore for data storage
- Admin dashboard with real-time metrics
- Production-ready with error handling and rate limiting
- Comprehensive documentation and deployment guides"
```

### Step 6: Push to GitHub

```bash
# Push to GitHub
git push -u origin main

# Verify
git remote -v
```

You should see:
```
origin  https://github.com/yourusername/africlaw.git (fetch)
origin  https://github.com/yourusername/africlaw.git (push)
```

### Step 7: Verify on GitHub

1. Go to your repository URL: `https://github.com/yourusername/africlaw`
2. You should see all your files
3. Verify .env is NOT visible (only .env.example is)
4. Check that README.md displays properly

## After Pushing to GitHub

### Deploy to Production (Railway)

```bash
# 1. Go to Railway.app
# 2. Click "New Project" → "Deploy from GitHub"
# 3. Select your africlaw repository
# 4. Railway will automatically:
#    - Install dependencies from package.json
#    - Build the project
#    - Deploy the Procfile
# 5. Add environment variables in Railway dashboard:
#    - Copy variables from your .env file
#    - Paste into Railway Variables section
# 6. Railway generates your URL automatically
# 7. Update Twilio webhook to point to your Railway URL
```

### Making Updates

After making changes to your project:

```bash
# Pull latest changes (if working with team)
git pull origin main

# Make your changes...

# Add changes
git add .

# Commit
git commit -m "Description of changes"

# Push to GitHub
git push origin main

# Railway will automatically redeploy!
```

## GitHub Commands Cheat Sheet

```bash
# Check status
git status

# See commit history
git log --oneline

# See what changed
git diff

# Undo changes
git checkout -- filename

# Undo last commit (keep changes)
git reset --soft HEAD~1

# View remote
git remote -v

# Switch branches
git checkout -b feature-name

# Merge branch
git merge feature-name
```

## Security Best Practices

1. ✅ .env is in .gitignore (never commit secrets)
2. ✅ Use .env.example as template
3. ✅ Add environment variables to Railway/Vercel dashboard, NOT GitHub
4. ✅ Never commit API keys or credentials
5. ✅ Review .gitignore before pushing

## Troubleshooting

### "fatal: not a git repository"
```bash
git init
git remote add origin https://github.com/yourusername/africlaw.git
```

### "Permission denied (publickey)"
You need to set up SSH keys:
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Add to ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Add public key to GitHub Settings → SSH Keys
cat ~/.ssh/id_ed25519.pub
```

### ".env was committed accidentally"
```bash
# Remove from history
git rm --cached .env
git commit -m "Remove .env from version control"
git push origin main

# Regenerate new credentials (as .env was exposed)
```

### Large files warning
If node_modules gets committed:
```bash
git rm -r --cached node_modules
git commit -m "Remove node_modules"
git push origin main
```

## What Gets Pushed

✅ Pushed to GitHub:
- All source code (src/)
- Documentation files (.md)
- package.json (dependencies list)
- .env.example (template)
- .gitignore
- Procfile (deployment config)

❌ NOT pushed to GitHub:
- .env (your actual credentials)
- node_modules/ (dependencies)
- .DS_Store (Mac files)
- Logs and temp files

## Next: Deploy to Production

Once on GitHub, you can deploy with one click:

### Option 1: Railway (Recommended)
1. Go to railway.app
2. "New Project" → "Deploy from GitHub"
3. Select africlaw repository
4. Add .env variables
5. Done!

### Option 2: Vercel
1. Go to vercel.com
2. "New Project" → "Import Git Repository"
3. Select africlaw
4. Add environment variables
5. Deploy

### Option 3: Heroku
1. Go to heroku.com
2. "New" → "Create new app"
3. Connect GitHub repository
4. Enable auto-deploys from main branch
5. Add config vars (environment variables)
6. Deploy

## Need Help?

- GitHub Docs: https://docs.github.com
- Git Tutorial: https://git-scm.com/book/en/v2
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
