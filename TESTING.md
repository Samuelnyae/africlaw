# AfriClaw Testing Guide

## Overview

AfriClaw is a **backend API server**, not a frontend application. The preview shows an interactive documentation page explaining all available endpoints.

## What You're Seeing

When you view the preview, you'll see:
- ✅ **Homepage** - Interactive API documentation with all endpoints listed
- ✅ **Status Indicator** - Shows if running in mock mode or production
- ✅ **Getting Started** - Links to all documentation files

## Running Modes

### 🟢 Mock Mode (Development without Firebase)
- **Status**: Currently running in MOCK MODE
- **Use Case**: Testing locally without real Firebase credentials
- **How to Enable**: Run without setting `FIREBASE_PROJECT_ID` env variable
- **Data**: All data is simulated; nothing is persisted
- **Perfect For**: Learning, debugging, local development

### 🔴 Production Mode (with Firebase)
- **Status**: Enable by setting `FIREBASE_PROJECT_ID`
- **Use Case**: Real deployment with actual data storage
- **Data**: All messages and user data stored in Firestore
- **When**: After getting Firebase credentials

## Testing Endpoints

### Test via Preview (No Setup Required)

1. **Homepage & Docs**
   - Go to `/` to see this interactive documentation
   - Shows all available endpoints
   - Works in mock mode ✅

2. **Health Check**
   ```bash
   # In browser or terminal
   curl http://localhost:3000/health
   ```
   Response:
   ```json
   {
     "status": "OK",
     "service": "AfriClaw",
     "timestamp": "2024-05-01T12:34:56.789Z"
   }
   ```

### Test Admin Dashboard

Since basic auth is required, you need to use credentials.

**Credentials (in mock mode):**
- Username: `admin`
- Password: `admin` (default, set via `ADMIN_PASSWORD` env var)

**Access Dashboard:**
```bash
# Open in browser with basic auth
# http://admin:admin@localhost:3000/admin
```

Or use curl:
```bash
curl -u admin:admin http://localhost:3000/admin/data
```

### Test WhatsApp Webhook (Local)

You can simulate a WhatsApp message:

```bash
curl -X POST http://localhost:3000/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "Body": "Hello AfriClaw",
    "From": "whatsapp:+254712345678"
  }'
```

**In mock mode:** Returns success immediately
**In production:** 
- Validates with Twilio
- Sends to Claude for response
- Stores in Firestore
- Replies via WhatsApp

### Test API Endpoints

**Get all users:**
```bash
curl -u admin:admin http://localhost:3000/api/users
```

**Get conversations:**
```bash
curl -u admin:admin http://localhost:3000/api/conversations/254712345678
```

**Get M-Pesa transactions:**
```bash
curl -u admin:admin http://localhost:3000/api/mpesa/transactions
```

## Testing Workflow

### Phase 1: Local Development (Right Now ✅)

**Currently Running:** Mock mode with test data
**What to Test:**
1. ✅ Server is running
2. ✅ Homepage loads
3. ✅ Health check works
4. ✅ Basic endpoints respond
5. ✅ Admin dashboard loads (with credentials)

**How to Test:**
```bash
# 1. View homepage
open http://localhost:3000

# 2. Check health
curl http://localhost:3000/health

# 3. Access admin (username: admin, password: admin)
open http://admin:admin@localhost:3000/admin

# 4. Get API data
curl -u admin:admin http://localhost:3000/admin/data
```

### Phase 2: Local Testing with Real Credentials

**Prerequisites:**
- Twilio WhatsApp account
- Anthropic Claude API key
- Firebase project + service account

**Steps:**
1. Create `.env` file with credentials (see `.env.example`)
2. Restart server: `npm run dev`
3. Server connects to Firebase
4. Test WhatsApp webhook with ngrok

**To test WhatsApp:**
```bash
# Install ngrok
npm install -g ngrok

# In terminal 1: Start server
npm run dev

# In terminal 2: Start ngrok tunnel
ngrok http 3000

# Use the ngrok URL as Twilio webhook:
# https://YOUR_NGROK_URL.ngrok.io/whatsapp/webhook

# Send WhatsApp message to your Twilio number
# Bot should respond via Claude AI
```

### Phase 3: Production Deployment

**Platforms:**
- Railway.app (easiest, 5 minutes)
- Vercel (serverless)
- Docker (full control)
- Traditional hosting

**See:** `DEPLOYMENT.md` for detailed instructions

## What Gets Tested at Each Phase

| Feature | Mock Mode | Local with Credentials | Production |
|---------|-----------|----------------------|-----------|
| Server startup | ✅ | ✅ | ✅ |
| Homepage | ✅ | ✅ | ✅ |
| Health check | ✅ | ✅ | ✅ |
| Admin dashboard | ✅ | ✅ | ✅ |
| WhatsApp messages | Mock | ✅ Real | ✅ Real |
| Claude responses | Mock | ✅ Real | ✅ Real |
| Firestore storage | Mock | ✅ Real | ✅ Real |
| M-Pesa payments | Mock | ✅ Real | ✅ Real |
| Rate limiting | ✅ | ✅ | ✅ |

## Common Testing Scenarios

### Scenario 1: Check Server is Running
```bash
curl http://localhost:3000/health
# Should return: {"status":"OK","service":"AfriClaw",...}
```

### Scenario 2: View Admin Dashboard
```
1. Open browser
2. Go to http://localhost:3000/admin
3. Enter credentials: admin / admin
4. Should see dashboard with metrics
```

### Scenario 3: Simulate WhatsApp Message
```bash
curl -X POST http://localhost:3000/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "Body": "Hello, are you there?",
    "From": "whatsapp:+254712345678"
  }'
```

### Scenario 4: Test Real Twilio Integration
```bash
# 1. Setup ngrok: ngrok http 3000
# 2. Configure Twilio webhook to ngrok URL
# 3. Send WhatsApp message from real number
# 4. Server receives and processes
# 5. Check dashboard for message
```

## Debug Mode

To enable detailed logging:

```bash
# In .env
NODE_ENV=development
DEBUG=africlaw:*
```

The server logs all activity:
```
[AfriClaw] Message received from +254712345678
[AfriClaw] Language detected: sw (Swahili)
[AfriClaw] Calling Claude API...
[AfriClaw] Response received: "Jambo! ..."
[AfriClaw] Storing message in Firestore
[AfriClaw] Sending WhatsApp reply
```

## Error Troubleshooting

### "Firebase initialization error: Service account object must contain a string "project_id""
- **Cause**: Missing Firebase credentials
- **Solution**: Either set `FIREBASE_PROJECT_ID` or continue in mock mode
- **Status**: ✅ Expected in development

### "Rate limit exceeded"
- **Cause**: Sent more than 30 messages/hour from same number
- **Solution**: Wait 1 hour or use different phone number
- **For Testing**: Modify rate limit in `src/middleware/rateLimit.js`

### "Admin authentication failed"
- **Cause**: Wrong credentials
- **Solution**: Default is username: `admin`, password: `admin`
- **Custom**: Set `ADMIN_PASSWORD` env variable

### "WhatsApp webhook signature invalid"
- **Cause**: Twilio signature verification failed
- **Solution**: Ensure Twilio auth token matches
- **For Testing**: Comment out signature check in development

## Performance Testing

### Load Testing
```bash
# Install Apache Bench
# macOS: brew install httpd

# Test 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:3000/health

# Test webhook (rate limited to 30/hr/user)
ab -n 10 -c 5 http://localhost:3000/whatsapp/webhook
```

### Memory Usage
```bash
# Monitor server memory while running
node --inspect src/index.js
# Then open: chrome://inspect
```

## Next Steps

1. **Understand the Code**: Read `PROJECT_STRUCTURE.md`
2. **Local Testing**: Follow `QUICKSTART.md`
3. **Get Credentials**: See `CONFIG_REFERENCE.md`
4. **Deploy**: Use `DEPLOYMENT.md`

## Need Help?

- Check `README.md` for feature documentation
- Review `CONFIG_REFERENCE.md` for credential setup
- See `PROJECT_STRUCTURE.md` for code walkthrough
- Read logs in terminal for error messages

---

**Happy Testing! 🚀**
