# Get AfriClaw from v0 to GitHub

Complete step-by-step guide to export your project and push to GitHub.

## Option 1: Download ZIP from v0 (Easiest)

### Step 1: Download Project
1. In v0, click the **three dots (⋯)** in top right corner of your code block
2. Click **"Download ZIP"**
3. Wait for download to complete
4. Extract the ZIP file to your computer

Your folder structure will look like:
```
africlaw/
├── src/
├── public/
├── .env
├── .env.example
├── package.json
├── Procfile
├── README.md
└── ... other files
```

### Step 2: Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Sign in (or create account if needed)
3. Click **"+"** in top right → **"New repository"**
4. Fill in details:
   - **Repository name:** `africlaw`
   - **Description:** Africa's AI WhatsApp Assistant powered by Claude, Twilio, Firebase
   - **Public** or **Private** (your choice)
   - Check: **"Add a .gitignore"** (select Node.js)
   - Check: **"Add a license"** (MIT is good)
5. Click **"Create repository"**

### Step 3: Initialize Git Locally

Open terminal/command prompt in your extracted `africlaw` folder:

```bash
# Initialize git
git init

# Add GitHub as remote (copy the URL from your new repo)
git remote add origin https://github.com/YOUR_USERNAME/africlaw.git

# Set branch to main
git branch -M main
```

### Step 4: Push Your Code

```bash
# Stage all files
git add .

# Create initial commit
git commit -m "Initial commit: AfriClaw WhatsApp AI Bot with Twilio, Claude, Firebase"

# Push to GitHub
git push -u origin main
```

Done! Your code is now on GitHub.

---

## Option 2: Use v0's GitHub Integration (If Available)

If v0 has GitHub integration:

1. In v0 settings (top right), click **"Settings"**
2. Look for **"Git"** or **"GitHub"** section
3. Connect your GitHub account
4. Follow the prompts to create/push to a repository

---

## Verify Your Repository

1. Go to: `https://github.com/YOUR_USERNAME/africlaw`
2. You should see:
   - ✅ All your source files
   - ✅ Documentation
   - ✅ package.json
   - ✅ .env.example (but NOT .env - it's protected)

---

## Important: Protect Your Credentials

Your `.env` file contains secrets. Make sure:

1. ✅ `.env` is in `.gitignore` (don't commit it)
2. ✅ Only `.env.example` is visible on GitHub
3. ✅ Never paste credentials in commit messages
4. ✅ When deploying, add environment variables through the platform's dashboard

---

## Next: Deploy from GitHub

Now that your code is on GitHub, you can deploy with one click:

### Deploy to Railway.app

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub"**
4. Select your `africlaw` repository
5. Railway automatically detects it's a Node.js app
6. Go to **"Variables"** tab
7. Add each environment variable from your `.env`:
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_PHONE_NUMBER
   - ANTHROPIC_API_KEY
   - FIREBASE_PROJECT_ID
   - FIREBASE_PRIVATE_KEY
   - (and all other variables)
8. Click **"Deploy"**
9. Get your URL: `https://your-app.up.railway.app`
10. Update Twilio webhook to point to: `https://your-app.up.railway.app/whatsapp/webhook`

### Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Click **"Import Git Repository"**
4. Select `africlaw`
5. In **"Environment Variables"** section, add all your variables
6. Click **"Deploy"**

### Deploy to Heroku

1. Go to [heroku.com](https://heroku.com)
2. Click **"New"** → **"Create new app"**
3. Enter app name: `africlaw`
4. Click **"Create app"**
5. Go to **"Deploy"** tab
6. Connect GitHub repository
7. Select `africlaw` repo
8. Go to **"Settings"** tab
9. Click **"Reveal Config Vars"**
10. Add all environment variables
11. Go to **"Deploy"** tab
12. Click **"Enable Automatic Deploys"**
13. Click **"Deploy Branch"**

---

## Update Twilio Webhook

After deployment, update Twilio to send messages to your deployed app:

1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to **"Messaging"** → **"Settings"** → **"WhatsApp Sandbox Settings"**
3. Update **"When a message comes in"** webhook to:
   ```
   https://your-deployed-app-url/whatsapp/webhook
   ```
   - Railway: `https://your-app.up.railway.app/whatsapp/webhook`
   - Vercel: `https://your-app.vercel.app/whatsapp/webhook`
   - Heroku: `https://your-app.herokuapp.com/whatsapp/webhook`

4. Save settings

---

## Test Your Deployment

After everything is deployed:

1. Send a WhatsApp message to your Twilio phone number
2. Your bot should respond with an AI-generated message
3. Check admin dashboard: `https://your-app-url/admin`
4. Verify user was created in Firebase
5. Check metrics in real-time

---

## Common Issues

### "fatal: not a git repository"
Solution: Make sure you're in the extracted `africlaw` folder
```bash
cd path/to/africlaw
git init
```

### "Permission denied (publickey)"
Solution: Set up SSH keys on GitHub
```bash
ssh-keygen -t ed25519 -C "your@email.com"
# Add the public key to GitHub settings
```

### ".env file not uploading"
Solution: This is GOOD! .env is in .gitignore for security
- Add variables through deployment platform's dashboard

### "Module not found" after deployment
Solution: Run in your project folder:
```bash
npm install
```

---

## Git Commands You'll Need

After first setup, use these to update your code:

```bash
# Check what changed
git status

# Add changes
git add .

# Commit
git commit -m "Description of changes"

# Push to GitHub (auto-deploys if you enabled it)
git push origin main

# Pull latest from GitHub
git pull origin main
```

---

## Summary

1. **Download ZIP** from v0
2. **Create GitHub repo** with .gitignore and LICENSE
3. **Initialize git** locally
4. **Push to GitHub**
5. **Deploy** from GitHub to Railway/Vercel/Heroku
6. **Update Twilio webhook**
7. **Test** with real WhatsApp message
8. **Monitor** with admin dashboard

Your bot is now live!

---

## Need Help?

- Check **READY_TO_DEPLOY.md** for deployment options
- Check **GITHUB_SETUP.md** for detailed GitHub guide
- Check **README.md** for API documentation
- Check other documentation files for specific topics
