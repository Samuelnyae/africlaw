# AfriClaw Configuration Reference

Complete guide to all environment variables and configuration options.

## Environment Variables

### Server Configuration

```env
# Port to run server on (default: 3000)
PORT=3000

# Environment type (development, production, staging)
NODE_ENV=development

# Public URL for webhooks (important for callbacks)
WEBHOOK_URL=http://localhost:3000
# In production: https://your-domain.com
```

---

## Twilio Configuration

### Required Variables

```env
# Account credentials from Twilio Console → Settings → Account SID
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Auth token from Twilio Console → Settings → Auth Token
TWILIO_AUTH_TOKEN=auth_token_with_32_characters_here

# Your WhatsApp phone number (format important!)
TWILIO_PHONE_NUMBER=whatsapp:+1234567890
```

### Getting Twilio Credentials

1. Go to https://console.twilio.com
2. Left sidebar → Account
3. Copy SID and Auth Token
4. Left sidebar → Messaging → Try it out → WhatsApp
5. Copy your WhatsApp sandbox number
6. Format: `whatsapp:+1234567890` (with country code and + sign)

### Testing Twilio

```bash
# Verify credentials work
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"

# Should return account info (200 OK)
```

---

## Anthropic Claude Configuration

### Required Variables

```env
# API key from Anthropic Console
# Get at: https://console.anthropic.com/account/keys
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Getting Claude API Key

1. Go to https://console.anthropic.com
2. Left sidebar → API Keys
3. Click "Create Key"
4. Copy the key (starts with `sk-ant-`)
5. Keep secure! Can't be recovered.

### Configuration Options

```javascript
// In src/handlers/claude.js

// Model selection (can change anytime)
model: 'claude-3-5-sonnet-20241022'

// Response length (tokens)
max_tokens: 1024  // Adjust based on needs

// System prompt (customize for your use case)
SYSTEM_PROMPT = `You are AfriClaw...`
```

### Testing Claude

```bash
# If you want to test API directly (requires apiKey in curl)
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
```

---

## Firebase Configuration

### Required Variables

Get all of these from Firebase service account JSON file.

```env
# Firebase project ID (visible in Firebase console)
FIREBASE_PROJECT_ID=your-project-id

# From service account JSON: project_id
FIREBASE_PROJECT_ID=my-awesome-project

# From service account JSON: private_key_id
FIREBASE_PRIVATE_KEY_ID=1234567890abcdef1234567890abcdef12345678

# From service account JSON: private_key (with escaped newlines!)
# IMPORTANT: Replace actual \n with literal \n in .env
# If your key has lines:
# -----BEGIN PRIVATE KEY-----
# MIIEpAIBAAKCAQEA...
# ...more lines...
# -----END PRIVATE KEY-----
# 
# Then in .env use:
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END PRIVATE KEY-----\n"

# From service account JSON: client_email
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# From service account JSON: client_id
FIREBASE_CLIENT_ID=1234567890

# Standard OAuth URLs (usually always the same)
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs

# From service account JSON: client_x509_cert_url
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
```

### Getting Firebase Credentials

**Step 1: Create Firebase Project**
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Enter project name
4. Accept terms
5. Create project

**Step 2: Enable Firestore**
1. Left sidebar → Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" (can change later)
4. Choose region (us-central1 recommended)
5. Create

**Step 3: Generate Service Account Key**
1. Left sidebar → Settings (gear icon) → Settings
2. Tab → "Service Accounts"
3. "Generate New Private Key"
4. Copy JSON and paste into `.env`

**Step 4: Create Collections**
In Firebase console → Firestore Database:
1. Click "Start collection"
2. Name: `users`
3. Add first document (can delete later)
4. Repeat for `conversations` and `mpesa_transactions`

### Firebase Collections Structure

```
users/
  {phoneNumber}/
    {
      phoneNumber: "+254712345678",
      userId: "uuid",
      createdAt: "2024-05-01T...",
      lastMessageAt: "2024-05-01T...",
      language: "en",
      conversationCount: 0,
      totalMessages: 0,
      preferences: { ... }
    }

conversations/
  {phoneNumber}/
    messages/
      {messageId}/
        {
          id: "uuid",
          role: "user",
          content: "Message text",
          timestamp: "2024-05-01T...",
          createdAt: 1714560000
        }

mpesa_transactions/
  {CheckoutRequestID}/
    {
      CheckoutRequestID: "WEB...",
      phoneNumber: "+254...",
      amount: 1000,
      status: "pending",
      createdAt: "2024-05-01T..."
    }
```

### Testing Firebase

```bash
# In Node.js console with .env loaded:
const { db } = require('./src/config/firebase');

// List all collections
const collections = await db.listCollections();
collections.forEach(c => console.log(c.id));

// Get user
const user = await db.collection('users').doc('+254712345678').get();
console.log(user.data());
```

---

## M-Pesa Daraja Configuration

### Required Variables

```env
# Consumer key from Daraja app
MPESA_CONSUMER_KEY=your_consumer_key_here

# Consumer secret from Daraja app
MPESA_CONSUMER_SECRET=your_consumer_secret_here

# Your registered shortcode (5-6 digits)
MPESA_SHORTCODE=123456

# Passkey for STK Push authentication
MPESA_PASSKEY=your_passkey_here

# API URL (sandbox for testing, production when ready)
MPESA_API_URL=https://sandbox.safaricom.co.ke
# Production: https://api.safaricom.co.ke
```

### Getting M-Pesa Credentials

**Step 1: Register with Safaricom**
1. Go to https://developer.safaricom.co.ke
2. Sign up for account
3. Verify email

**Step 2: Create App**
1. Dashboard → "Create New App"
2. Name your app
3. Select "Lipa na M-Pesa Online" (STK Push)
4. Accept terms
5. Create app

**Step 3: Get Credentials**
1. App page shows:
   - Consumer Key
   - Consumer Secret
   - Shortcode
   - Passkey
2. Copy to `.env`

**Step 4: Configure Daraja**
1. App Settings:
   - STK Callback URL: `https://your-domain/mpesa/callback`
   - Save

### M-Pesa Phone Number Format

Important: Remove + sign and use country code!

```javascript
// WRONG (with +)
phoneNumber: "+254712345678"

// RIGHT (without +, for M-Pesa)
phoneNumber: "254712345678"
```

### Testing M-Pesa

```bash
# In sandbox, test with Safaricom's test numbers
# Use: 254708374149 (Safaricom test account)

# Check your app's consumer credentials work
curl -X POST https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials \
  -H "Authorization: Basic $(echo -n 'consumer_key:consumer_secret' | base64)"

# Should return access token
```

### M-Pesa Sandbox vs Production

| Aspect | Sandbox | Production |
|--------|---------|-----------|
| **API URL** | `sandbox.safaricom.co.ke` | `api.safaricom.co.ke` |
| **Real Money** | No | Yes |
| **Testing** | Yes | No |
| **Switch** | Change `MPESA_API_URL` in `.env` | |
| **Phone** | Use test numbers provided | Real customer numbers |
| **Timeline** | Instant | 1-2 seconds |

---

## Admin Dashboard Configuration

### Required Variables

```env
# Password for accessing admin dashboard
# Must be strong! Minimum 12 characters
ADMIN_PASSWORD=your_very_secure_password_here
```

### Setting Admin Password

1. Generate strong password:
   ```bash
   # Using OpenSSL
   openssl rand -base64 12
   # Output: aBcDeFgHiJkL
   ```

2. Add to `.env`:
   ```env
   ADMIN_PASSWORD=aBcDeFgHiJkL
   ```

3. Access dashboard:
   - URL: `http://localhost:3000/admin`
   - Username: `admin`
   - Password: `aBcDeFgHiJkL`

### Changing Admin Password

1. Update `.env` with new password
2. Restart server: `npm run dev`
3. Old password no longer works

### Dashboard Features

Once logged in:
- Real-time user statistics
- Daily message count
- Active users (24h)
- M-Pesa transaction summary
- Recent conversation list
- Auto-refresh every 30 seconds
- Manual refresh button

---

## Rate Limiting Configuration

### Variables

```env
# Maximum messages per user per hour (default: 30)
RATE_LIMIT_MAX_REQUESTS=30

# Time window in milliseconds (default: 1 hour)
RATE_LIMIT_WINDOW_MS=3600000

# 1 hour = 60 * 60 * 1000 = 3600000 ms
# 30 mins = 30 * 60 * 1000 = 1800000 ms
# 24 hours = 24 * 60 * 60 * 1000 = 86400000 ms
```

### Adjusting Rate Limits

**Development (allow more for testing)**:
```env
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=3600000
```

**Production (strict)**:
```env
RATE_LIMIT_MAX_REQUESTS=30
RATE_LIMIT_WINDOW_MS=3600000
```

**Tight Security (prevent abuse)**:
```env
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_WINDOW_MS=1800000  # 30 minutes
```

### User Feedback

When user exceeds limit, they receive:

**English**:
> "You've sent too many messages today. Please try again tomorrow."

**Swahili**:
> "Umetumia ujumbe mwingi sana leo. Tafadhali jaribu kesho."

---

## Optional Configuration

### Webhook Verification Token

```env
# Optional extra security layer for webhooks
WEBHOOK_TOKEN=your_secret_token_here
```

### Database Retention

```env
# Days to keep messages (auto-delete older than this)
# 90 days is default (3 months)
# In src/services/messageService.js: deleteOldMessages(phone, daysOld)
MESSAGE_RETENTION_DAYS=90
```

### Claude Response Customization

Edit `src/handlers/claude.js`:

```javascript
// Change system prompt for different behavior
const SYSTEM_PROMPT = `You are AfriClaw...`

// Adjust max response length (tokens)
max_tokens: 512  // Shorter responses
max_tokens: 2048 // Longer responses

// Change model to different Claude version
model: 'claude-3-opus-20240229'  // Most capable
model: 'claude-3-haiku-20240307' // Fastest, cheapest
```

---

## Configuration Validation Checklist

```bash
# Check if all required variables are set
required_vars=(
  "PORT"
  "TWILIO_ACCOUNT_SID"
  "TWILIO_AUTH_TOKEN"
  "TWILIO_PHONE_NUMBER"
  "ANTHROPIC_API_KEY"
  "FIREBASE_PROJECT_ID"
  "FIREBASE_PRIVATE_KEY"
  "FIREBASE_CLIENT_EMAIL"
  "ADMIN_PASSWORD"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "Missing: $var"
  fi
done
```

---

## Troubleshooting Configuration

### Firebase Initialization Error

**Problem**: `FIREBASE_PRIVATE_KEY format error`

**Solution**: 
1. Check private key has `\n` (not actual newlines)
2. Open original JSON in text editor
3. Copy private_key field exactly
4. Use triple quotes in `.env`: `FIREBASE_PRIVATE_KEY="..."`

### Twilio Signature Validation Fails

**Problem**: `Invalid Twilio signature`

**Solution**:
1. Verify `TWILIO_AUTH_TOKEN` exactly matches console
2. Verify webhook URL matches exactly in Twilio settings
3. Signature verification is disabled by default (enable in prod)

### Claude API Returns 401

**Problem**: `Unauthorized API key`

**Solution**:
1. Copy API key exactly (no spaces)
2. Key should start with `sk-ant-`
3. Verify in Anthropic console the key exists
4. Check billing account is active

### M-Pesa STK Push Not Working

**Problem**: `No payment prompt appears on phone`

**Solution**:
1. Verify phone number format: `254712345678` (no + sign)
2. Use Safaricom number in sandbox (provided by Daraja)
3. Check `MPESA_SHORTCODE` and `MPESA_PASSKEY` are correct
4. Verify callback URL is set in Daraja app settings

### Admin Dashboard Says "Unauthorized"

**Problem**: Can't log into `/admin`

**Solution**:
1. Username is always: `admin` (lowercase)
2. Password is: value of `ADMIN_PASSWORD` in `.env`
3. Use Basic Auth (browser will prompt)
4. If incorrect, server returns 401

---

## Configuration Security Best Practices

### DO ✅

- Store all secrets in `.env` file
- Use strong passwords (16+ chars)
- Rotate API keys periodically
- Use different passwords for dev/prod
- Add `.env` to `.gitignore`
- Use environment variables in CI/CD
- Enable Firebase RLS in production
- Monitor API usage and costs

### DON'T ❌

- Commit `.env` to Git
- Share API keys in chat/email
- Use same password for dev and prod
- Hardcode secrets in source code
- Log sensitive information
- Share Firebase credentials
- Disable signature verification in production
- Use weak/default passwords

---

## Configuration for Different Environments

### Development

```env
NODE_ENV=development
PORT=3000
TWILIO_PHONE_NUMBER=whatsapp:+1234567890  # Sandbox
ANTHROPIC_API_KEY=sk-ant-...
MPESA_API_URL=https://sandbox.safaricom.co.ke
WEBHOOK_URL=http://localhost:3000
ADMIN_PASSWORD=devpass123
RATE_LIMIT_MAX_REQUESTS=1000
```

### Staging

```env
NODE_ENV=development
PORT=3000
TWILIO_PHONE_NUMBER=whatsapp:+1234567890  # Business
ANTHROPIC_API_KEY=sk-ant-...
MPESA_API_URL=https://sandbox.safaricom.co.ke
WEBHOOK_URL=https://staging.your-domain.com
ADMIN_PASSWORD=<strong_password>
RATE_LIMIT_MAX_REQUESTS=100
```

### Production

```env
NODE_ENV=production
PORT=3000
TWILIO_PHONE_NUMBER=whatsapp:+1234567890  # Business
ANTHROPIC_API_KEY=sk-ant-...
MPESA_API_URL=https://api.safaricom.co.ke  # Production!
WEBHOOK_URL=https://your-domain.com
ADMIN_PASSWORD=<very_strong_password>
RATE_LIMIT_MAX_REQUESTS=30
```

---

## Quick Configuration Copy-Paste Template

```env
# Server
PORT=3000
NODE_ENV=production
WEBHOOK_URL=https://your-domain.com

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=whatsapp:+1234567890

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=xxxxxxxxxxxxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@xxxxx.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=xxxxxxxxxxxxxxxxxx
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/certificates/xxxxx

# M-Pesa
MPESA_CONSUMER_KEY=xxxxxxxxxxxxx
MPESA_CONSUMER_SECRET=xxxxxxxxxxxxx
MPESA_SHORTCODE=123456
MPESA_PASSKEY=xxxxxxxxxxxxx
MPESA_API_URL=https://api.safaricom.co.ke

# Admin
ADMIN_PASSWORD=your_very_secure_password_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=30
```

---

**Reference Version**: 1.0.0  
**Last Updated**: 2024-05-01
