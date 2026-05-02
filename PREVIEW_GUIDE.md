# 👁️ Understanding the Preview

## What You're Seeing

The v0 Preview is displaying the **AfriClaw API Homepage** - an interactive documentation page showing all available endpoints and how to use them.

## Homepage Features

### Status Indicator
- **🟢 SERVER RUNNING** - Server is active and responding
- **⚠️ MOCK MODE** - Running in development mode without Firebase
- **🔥 PRODUCTION** - Connected to real Firebase (when credentials are set)

### Interactive API Documentation
Shows all available endpoints:
- `GET /` - This homepage
- `GET /health` - Server status check
- `GET /admin` - Admin dashboard
- `POST /whatsapp/webhook` - Receives messages
- And more...

## Why a Backend Homepage?

AfriClaw is a **backend API server**, not a traditional web application. It handles:
- WhatsApp messaging via Twilio
- AI responses via Claude
- Payment processing via M-Pesa
- Data storage via Firebase

The homepage serves as interactive documentation for developers integrating with the API.

## Testing in Preview

### 1. View the Homepage
Simply view the preview to see all endpoints listed with descriptions.

### 2. Test Health Check
Click on a browser console and run:
```javascript
fetch('http://localhost:3000/health')
  .then(r => r.json())
  .then(d => console.log(d))
```

### 3. Access Admin Dashboard
The admin dashboard is available at `/admin` with credentials:
- Username: `admin`
- Password: `admin` (default)

## What Happens in Each Mode

### 🟢 Mock Mode (Current)
```
User Action → Server receives → Mock response → No database
```
- Perfect for testing
- No Firebase needed
- All data is simulated
- Good for understanding the flow

### 🔥 Production Mode
```
User Action → Server → Claude AI → Firestore → Response
```
- Requires Firebase credentials
- Real AI responses from Claude
- All data persisted
- Ready for real users

## Next: Get It Running Locally

To actually use AfriClaw:

1. **Read Documentation**
   - Open `START_HERE.md` (documentation index)
   - Read `QUICKSTART.md` (15-minute setup)

2. **Setup Locally**
   - Clone repository
   - Copy `.env.example` to `.env`
   - Get credentials (see `CONFIG_REFERENCE.md`)
   - Run `npm install && npm run dev`

3. **Test Endpoints**
   ```bash
   # Test health
   curl http://localhost:3000/health
   
   # Test admin
   curl -u admin:admin http://localhost:3000/admin/data
   
   # Simulate message
   curl -X POST http://localhost:3000/whatsapp/webhook \
     -H "Content-Type: application/json" \
     -d '{"Body":"Hello","From":"whatsapp:+1234567890"}'
   ```

4. **Deploy to Production**
   - See `DEPLOYMENT.md` for Railway, Vercel, Docker, etc.
   - Set real credentials
   - Connect Twilio webhook
   - Test with real WhatsApp

## Architecture Overview

```
WhatsApp User
    ↓
Twilio (WhatsApp API)
    ↓
[This Server - AfriClaw Backend]
    ├─ Receives message
    ├─ Detects language (Swahili/English)
    ├─ Calls Claude AI
    ├─ Stores in Firestore
    └─ Sends response back
    ↓
WhatsApp User (gets response)
```

## What Each Endpoint Does

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Homepage (you are here) |
| `/health` | GET | Server status check |
| `/whatsapp/webhook` | POST | Receives WhatsApp messages |
| `/admin` | GET | Admin dashboard |
| `/admin/data` | GET | Dashboard metrics |
| `/api/users` | GET | List all users |
| `/api/conversations/:phone` | GET | Get user messages |
| `/mpesa/callback` | POST | Payment confirmation |

## Testing Workflow

```
Step 1: View Preview ← You are here
           ↓
Step 2: Read QUICKSTART.md
           ↓
Step 3: Get Credentials
           ↓
Step 4: Run Locally
           ↓
Step 5: Deploy to Production
```

## Common Questions

**Q: Why do I see a page instead of a web app?**
A: AfriClaw is an API backend, not a frontend. The page shows API documentation.

**Q: How do I test WhatsApp messages?**
A: Either use ngrok to tunnel to a Twilio sandbox, or deploy and configure real webhooks.

**Q: Why does it say "MOCK MODE"?**
A: We're running without Firebase credentials. This is fine for testing! See `CONFIG_REFERENCE.md` to add real credentials.

**Q: Is this production-ready?**
A: Yes! The code is production-ready. You just need to add credentials and deploy.

**Q: How do I add real Firebase?**
A: Set `FIREBASE_PROJECT_ID` and other Firebase environment variables. See `CONFIG_REFERENCE.md`.

## Ready to Go?

1. **Just learning?** → Read the homepage and `README.md`
2. **Want to test locally?** → Follow `QUICKSTART.md`
3. **Ready to deploy?** → See `DEPLOYMENT.md`
4. **Need credentials?** → Check `CONFIG_REFERENCE.md`

---

**This is your backend API server. The preview is showing its interactive documentation homepage!** 🚀
