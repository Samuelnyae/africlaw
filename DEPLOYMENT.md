# AfriClaw Deployment Guide

Complete step-by-step instructions for deploying AfriClaw to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Railway.app Deployment](#railwayapp-deployment-recommended)
3. [Vercel Deployment](#vercel-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Post-Deployment Setup](#post-deployment-setup)
6. [Monitoring & Logging](#monitoring--logging)

---

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] All environment variables configured locally and working
- [ ] Firebase project created with Firestore collections
- [ ] Twilio account with WhatsApp Business API access
- [ ] Anthropic Claude API key with sufficient quota
- [ ] Safaricom M-Pesa Daraja credentials (if using payments)
- [ ] Strong `ADMIN_PASSWORD` set
- [ ] `.env` file added to `.gitignore` (never commit secrets!)
- [ ] GitHub repo created and code pushed
- [ ] Domain/URL for webhook callbacks
- [ ] SSL certificate (HTTPS required for production)

### Environment Variables Required

```env
PORT=3000
NODE_ENV=production

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=auth_token_here
TWILIO_PHONE_NUMBER=whatsapp:+1234567890

ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=xxxxxxxxxxxxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@xxxxx.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=xxxxxxxxxxxxxxxxxx
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/certificates/xxxxx

MPESA_CONSUMER_KEY=xxxxxxxxxxxxx
MPESA_CONSUMER_SECRET=xxxxxxxxxxxxx
MPESA_SHORTCODE=123456
MPESA_PASSKEY=xxxxxxxxxxxxx
MPESA_API_URL=https://api.safaricom.co.ke

ADMIN_PASSWORD=your_very_secure_password_here

WEBHOOK_URL=https://your-domain.com
```

---

## Railway.app Deployment (Recommended)

Railway is the easiest and most Node.js-friendly platform.

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub
3. Create new project

### Step 2: Connect GitHub Repository

1. Click "New" → "GitHub Repo"
2. Select your afric law repository
3. Authorize Railway to access GitHub

### Step 3: Configure Environment Variables

1. In Railway dashboard, go to your project
2. Click "Variables" tab
3. Add all environment variables from `.env.example`

**Important**: Use the "Raw Editor" to paste variables:

```
PORT=3000
NODE_ENV=production
TWILIO_ACCOUNT_SID=...
# ... all other variables
```

### Step 4: Configure Twilio Webhook

After Railway deploys, update Twilio:

1. Get your Railway domain: `yourapp-production.up.railway.app`
2. In Twilio console:
   - Go to WhatsApp settings
   - Set webhook URL: `https://yourapp-production.up.railway.app/whatsapp/webhook`
   - Keep webhook as POST
   - Save

### Step 5: Configure M-Pesa Callback

In Safaricom Daraja:

1. Go to your app settings
2. Set callback URL: `https://yourapp-production.up.railway.app/mpesa/callback`
3. Save

### Step 6: Deploy

1. Push code to GitHub: `git push origin main`
2. Railway auto-deploys
3. Monitor deployment in dashboard
4. View logs in "Logs" tab

### Testing Railway Deployment

```bash
curl https://yourapp-production.up.railway.app/health
```

Should return:
```json
{
  "status": "OK",
  "service": "AfriClaw",
  "timestamp": "2024-05-01T18:45:00.000Z"
}
```

---

## Vercel Deployment

Vercel works best for API-only projects with serverless functions.

**Note**: Vercel Serverless Functions have execution limits. For production, Railway is recommended.

### Step 1: Prepare Project

Create `vercel.json`:

```json
{
  "buildCommand": "npm install",
  "outputDirectory": ".",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/src/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Select your GitHub repository
4. Configure project settings

### Step 3: Add Environment Variables

1. In Vercel dashboard → Settings → Environment Variables
2. Add all variables from `.env.example`
3. Apply to Production environment

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Get production URL: `africlaw.vercel.app`

### Step 5: Update Webhooks

1. Twilio: `https://africlaw.vercel.app/whatsapp/webhook`
2. M-Pesa: `https://africlaw.vercel.app/mpesa/callback`

---

## Docker Deployment

Deploy AfriClaw using Docker (AWS ECS, Google Cloud Run, DigitalOcean, etc.)

### Step 1: Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src
COPY public ./public
COPY Procfile ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["npm", "start"]
```

### Step 2: Build Image

```bash
docker build -t africlaw:latest .
```

### Step 3: Run Locally

```bash
docker run -p 3000:3000 \
  -e TWILIO_ACCOUNT_SID=your_sid \
  -e TWILIO_AUTH_TOKEN=your_token \
  # ... add all env vars
  africlaw:latest
```

### Step 4: Push to Registry

```bash
# Docker Hub
docker tag africlaw:latest yourname/africlaw:latest
docker push yourname/africlaw:latest

# Or Google Container Registry
gcloud builds submit --tag gcr.io/your-project/africlaw
```

### Step 5: Deploy to Cloud Platform

#### AWS ECS:
```bash
# Create cluster, task definition, and service in AWS console
# Or use AWS CLI
aws ecs create-service --cluster africlaw --service-name africlaw-service ...
```

#### Google Cloud Run:
```bash
gcloud run deploy africlaw \
  --image gcr.io/your-project/africlaw \
  --platform managed \
  --region us-central1 \
  --set-env-vars TWILIO_ACCOUNT_SID=...
```

#### DigitalOcean:
1. Create App Platform app
2. Connect Docker image
3. Add environment variables
4. Deploy

---

## Post-Deployment Setup

### Step 1: Verify Health Check

```bash
curl https://your-domain.com/health
```

### Step 2: Test WhatsApp Webhook

Send a message from your test WhatsApp number:
- Should receive Claude response within 5 seconds
- Check production logs for errors

### Step 3: Test Admin Dashboard

```bash
# With your admin password
curl -u admin:YOUR_PASSWORD https://your-domain.com/admin
```

### Step 4: Configure Monitoring

#### Firebase:
1. Go to Firebase console
2. Enable Google Analytics (optional)
3. Set up alerts for quota limits

#### Twilio:
1. Go to Twilio console
2. Set up SMS alerts for errors
3. Monitor API usage

#### Application Monitoring:
Consider adding:
- Sentry.io (error tracking)
- LogRocket (session replay)
- New Relic (performance monitoring)

### Step 5: Set Up Logging

#### Railway Logs:
View in dashboard → Logs tab (auto-retained 7 days)

#### Vercel Logs:
View in dashboard → Logs tab

#### Self-hosted Docker:
```bash
docker logs -f africlaw-container
```

---

## Monitoring & Logging

### Key Metrics to Monitor

1. **Message Success Rate**: Messages delivered / received
2. **API Response Time**: Average < 3 seconds
3. **Claude API Quota**: Monitor usage in Anthropic console
4. **Firebase Quota**: Monitor in Firebase console
5. **Error Rate**: Track `[AfriClaw]` error logs
6. **Active Users**: From admin dashboard

### Production Logging Strategy

All logs prefixed with `[AfriClaw]`:

```
[AfriClaw] User found: +254712345678
[AfriClaw] Calling Claude for user: +254712345678
[AfriClaw] Claude response generated
[AfriClaw] WhatsApp message sent
[AfriClaw] Error: Firebase connection timeout
```

### Error Handling

Common errors and fixes:

| Error | Solution |
|-------|----------|
| Firebase credentials error | Verify service account JSON in `.env` |
| Twilio signature invalid | Check webhook URL matches exactly |
| Claude API rate limit | Reduce message volume or upgrade plan |
| M-Pesa STK push fails | Verify Daraja credentials and phone format |
| No messages received | Check webhook URL and Twilio logs |

### Scaling Considerations

As user base grows:

1. **Firebase**: Upgrade to Blaze plan for higher limits
2. **Claude**: Monitor API usage and costs
3. **Twilio**: Increase WhatsApp messaging capacity
4. **Database**: Consider caching with Redis for hot data
5. **Load balancing**: Use behind load balancer if needed
6. **Rate limiting**: Adjust per-user limits based on demand

### Scheduled Maintenance

Recommended tasks:

- **Daily**: Check error logs and alert responses
- **Weekly**: Review dashboard metrics and user growth
- **Monthly**: Analyze spending across platforms and optimize
- **Quarterly**: Update dependencies and security patches
- **Yearly**: Review architecture and plan for scaling

---

## Troubleshooting Deployment

### App won't start

1. Check all environment variables are set
2. Run `npm test` to verify dependencies
3. Check logs for specific errors
4. Verify Firebase credentials format

### Messages not being received

1. Verify webhook URL is correct in Twilio
2. Check webhook URL is publicly accessible
3. Monitor request logs for incoming webhooks
4. Check IP whitelist (if applicable)

### High latency

1. Check Firebase region (should match app region)
2. Monitor Claude API response times
3. Check network bandwidth
4. Consider caching for repeated queries

### Cost overruns

1. Check Claude API usage in Anthropic console
2. Monitor Firebase usage in Firebase console
3. Review Twilio messaging costs
4. Implement aggressive rate limiting if needed

---

## Security Checklist for Production

- [ ] All secrets in environment variables, not code
- [ ] HTTPS enforced (redirect HTTP → HTTPS)
- [ ] Strong admin password (min 16 characters)
- [ ] Firebase RLS policies enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info
- [ ] Logs don't contain PII
- [ ] Regular security updates applied
- [ ] Backup and disaster recovery plan

---

## Rollback Plan

If deployment breaks production:

1. **Quick Rollback**:
   ```bash
   git revert <commit-hash>
   git push origin main
   # Platform auto-redeploys
   ```

2. **Manual Rollback**:
   - Railway: Go to Deployments tab, click previous version
   - Vercel: Go to Deployments, click "Promote to Production"
   - Docker: Redeploy previous image tag

3. **Database Rollback**:
   - Use Firebase backups (available on Blaze plan)
   - Don't delete collections, pause service instead

---

## Support & Resources

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Firebase Docs: https://firebase.google.com/docs
- Twilio Docs: https://www.twilio.com/docs/whatsapp/api
- Anthropic Docs: https://docs.anthropic.com

---

**Ready to deploy? Start with Railway.app - it's the easiest! 🚀**
