# AfriClaw Quick Start Guide

Get AfriClaw running locally in 15 minutes.

## Prerequisites

- Node.js 18+ installed
- GitHub account (for version control)
- Twilio account (free sandbox available)
- Anthropic Claude API key
- Firebase account

## 5-Minute Setup

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/africlaw.git
cd africlaw
npm install
```

### 2. Get Twilio Credentials

1. Go to https://twilio.com/console
2. Copy `Account SID` and `Auth Token`
3. Go to WhatsApp Sandbox
4. Copy your WhatsApp number (format: `whatsapp:+1234567890`)

### 3. Get Claude API Key

1. Go to https://console.anthropic.com
2. Click "Create API Key"
3. Copy the API key

### 4. Set Up Firebase

1. Go to https://console.firebase.google.com
2. Create new project
3. Enable Firestore Database
4. Go to Settings → Service Accounts
5. Click "Generate New Private Key"
6. Download JSON and open it

### 5. Create .env File

```bash
cp .env.example .env
```

Fill in `.env` with your credentials:

```env
PORT=3000
NODE_ENV=development

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=whatsapp:+1234567890

ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=key_id_from_json
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@xxxxx.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=client_id_from_json
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https_from_json

MPESA_CONSUMER_KEY=skip_for_now
MPESA_CONSUMER_SECRET=skip_for_now
MPESA_SHORTCODE=skip_for_now
MPESA_PASSKEY=skip_for_now
MPESA_API_URL=https://sandbox.safaricom.co.ke

ADMIN_PASSWORD=devpassword123

WEBHOOK_URL=http://localhost:3000
```

### 6. Run Server

```bash
npm run dev
```

You should see:
```
╔══════════════════════════════════════╗
║    AfriClaw Server Started            ║
║    Listening on port 3000            ║
║    Environment: development         ║
╚══════════════════════════════════════╝
[AfriClaw] Waiting for WhatsApp messages...
```

### 7. Expose Locally with ngrok

In another terminal:

```bash
npx ngrok http 3000
```

Get your public URL: `https://xxx-xxx-xxx-xxx.ngrok.io`

### 8. Configure Twilio Webhook

1. Go to Twilio Console → WhatsApp
2. Sandbox Settings
3. Set webhook: `https://xxx-xxx-xxx-xxx.ngrok.io/whatsapp/webhook`
4. Keep POST method
5. Save

### 9. Test It!

Send a WhatsApp message to your Twilio sandbox number. You should get a response from Claude in 2-3 seconds!

## Testing the App

### Send Test Message

From your WhatsApp (or anyone added to Twilio sandbox):

```
Message: "Hello, what's the weather in Nairobi?"
Response: [Claude AI response about Nairobi weather]
```

### Check Logs

Watch your terminal for:

```
[AfriClaw] Message from +254712345678: Hello, what's the weather in Nairobi?
[AfriClaw] User found: +254712345678
[AfriClaw] Calling Claude for user: +254712345678
[AfriClaw] Claude response generated
[AfriClaw] WhatsApp message sent
```

### Try Swahili

Message in Swahili to test language detection:

```
Message: "Habari! Unaweza kusaidia nini?"
Response: [Claude responds in Swahili]
```

### Admin Dashboard

1. Open: `http://localhost:3000/admin`
2. Username: `admin`
3. Password: `devpassword123` (from .env)
4. See real-time metrics!

## Common Issues & Fixes

### "Firebase initialization error"

**Fix**: Check `.env` file - especially `FIREBASE_PRIVATE_KEY` formatting:
- Should have `\n` between lines
- Use exact text from service account JSON

### "Empty message received"

**Fix**: Twilio sometimes sends empty messages. The code handles this - just send another message.

### "Invalid Twilio signature"

**Fix**: 
1. Webhook signature verification is disabled by default
2. Update ngrok URL if it changes
3. Restart `npm run dev` after changing .env

### "Rate limit exceeded"

**Fix**: You can send 30 messages per hour. If developing, temporarily increase in `.env`:

```env
RATE_LIMIT_MAX_REQUESTS=1000
```

### "Twilio webhook not receiving messages"

**Fix**:
1. Check ngrok URL in Twilio is exactly correct
2. Restart ngrok (it changes every 8 hours)
3. Your number must be in Twilio sandbox
4. Check terminal logs for incoming requests

## Next Steps

Once working locally:

1. **Enable M-Pesa** (optional):
   - Get Safaricom Daraja credentials
   - Add to `.env`
   - Test payment flow

2. **Deploy to Production**:
   - Follow [DEPLOYMENT.md](DEPLOYMENT.md)
   - Railway.app recommended for easiest setup
   - Takes ~5 minutes to deploy

3. **Enable Firebase RLS**:
   - Protect data with Row-Level Security
   - See Firebase docs

4. **Set Up Monitoring**:
   - Sentry for errors
   - LogRocket for sessions
   - Datadog/New Relic for performance

5. **Customize Claude Prompts**:
   - Edit `src/handlers/claude.js`
   - Change `SYSTEM_PROMPT` for your use case
   - Add domain-specific knowledge

## File Structure Explained

```
africlaw/
├── src/
│   ├── index.js              # Main Express server
│   ├── config/firebase.js    # Firebase setup
│   ├── handlers/             # Message/API handlers
│   │   ├── whatsapp.js       # WhatsApp webhook
│   │   ├── claude.js         # Claude API calls
│   │   └── mpesa.js          # M-Pesa integration
│   ├── services/             # Database operations
│   │   ├── userService.js    # User management
│   │   ├── messageService.js # Message storage
│   │   └── dashboardService.js # Analytics
│   └── middleware/           # Express middleware
│       ├── auth.js           # Basic auth
│       └── rateLimit.js      # Rate limiting
├── public/
│   └── admin.html            # Admin dashboard UI
├── .env.example              # Template
├── package.json              # Dependencies
└── README.md                 # Full documentation
```

## Development Tips

### Hot Reload with nodemon

Already configured! Just run:

```bash
npm run dev
```

Changes to files in `src/` auto-reload.

### Debug Logging

All actions logged with `[AfriClaw]` prefix:

```javascript
console.log('[AfriClaw] Your message here');
```

Search logs for `[AfriClaw]` to track execution.

### Inspect Firestore Data

1. Go to Firebase Console
2. Firestore Database
3. Collections → `users` or `conversations`
4. Click a document to view data

### Test with Different Numbers

In Twilio sandbox, add more WhatsApp numbers to test with multiple "users".

## Useful Commands

```bash
# Start dev server with auto-reload
npm run dev

# Start production server
npm start

# Run tests (check dependencies)
npm test

# Format code with Prettier (if installed)
npx prettier --write src/
```

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `TWILIO_ACCOUNT_SID` | Twilio auth | `ACxxxx...` |
| `TWILIO_AUTH_TOKEN` | Twilio auth | `xxx...` |
| `TWILIO_PHONE_NUMBER` | Bot's WhatsApp | `whatsapp:+1234567890` |
| `ANTHROPIC_API_KEY` | Claude API | `sk-ant-xxx...` |
| `FIREBASE_PROJECT_ID` | Firebase project | `my-project` |
| `FIREBASE_PRIVATE_KEY` | Firebase auth | `-----BEGIN PRIVATE KEY-----...` |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account | `firebase-adminsdk@...` |
| `ADMIN_PASSWORD` | Admin dashboard password | `securepass123` |

## Rate Limiting Details

Default: **30 messages per hour per user**

User gets error message (Swahili):
> "Umetumia ujumbe mwingi sana leo. Tafadhali jaribu kesho."

Adjust in `.env`:
```env
RATE_LIMIT_MAX_REQUESTS=30
RATE_LIMIT_WINDOW_MS=3600000  # 1 hour in milliseconds
```

## Security Notes

⚠️ **Development Only**: Signature verification disabled for easier testing

For production, enable in `src/handlers/whatsapp.js`:
```javascript
if (!verifyTwilioRequest(req, process.env.TWILIO_AUTH_TOKEN)) {
  return res.status(403).send('Forbidden');
}
```

## API Endpoints Available

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/health` | GET | None | Health check |
| `/whatsapp/webhook` | POST | Twilio | Receive messages |
| `/admin` | GET | Basic auth | Dashboard UI |
| `/admin/data` | GET | Basic auth | Dashboard data |
| `/api/users` | GET | Basic auth | All users |
| `/api/conversations/:phone` | GET | Basic auth | User messages |

## Next Hour - What to Try

1. **Customize bot behavior** - Edit `SYSTEM_PROMPT` in `claude.js`
2. **Add keywords** - Make bot respond to specific phrases
3. **Test payment flow** - Add M-Pesa sandbox credentials
4. **Deploy locally** - Try Docker: `docker build -t africlaw .`
5. **Monitor admin** - Watch real-time metrics on `/admin`

## Want to Deploy?

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Railway.app (easiest, 5 minutes)
- Vercel (serverless)
- Docker (any cloud provider)

---

**You're all set! Your WhatsApp AI assistant is running. 🚀**

Have questions? Check the full [README.md](README.md) or deployment guides.
