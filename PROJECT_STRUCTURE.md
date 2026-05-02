# AfriClaw Project Structure & Architecture

Complete technical documentation of the AfriClaw codebase.

## Overview

AfriClaw is a production-ready Node.js/Express backend for a WhatsApp AI chatbot. It handles message routing, conversation management, M-Pesa payments, and admin analytics.

**Stack**: Express.js, Firebase Firestore, Twilio, Anthropic Claude, Safaricom Daraja

---

## Directory Structure

```
africlaw/
│
├── src/                          # Application source code
│   ├── index.js                  # Express server entry point (178 lines)
│   ├── config/
│   │   └── firebase.js           # Firebase Admin SDK initialization (36 lines)
│   │
│   ├── handlers/                 # Message and API handlers
│   │   ├── whatsapp.js           # Twilio webhook processing (186 lines)
│   │   ├── claude.js             # Claude AI integration (126 lines)
│   │   └── mpesa.js              # M-Pesa payment flow (213 lines)
│   │
│   ├── services/                 # Database and business logic
│   │   ├── userService.js        # User CRUD operations (116 lines)
│   │   ├── messageService.js     # Conversation storage (146 lines)
│   │   └── dashboardService.js   # Analytics queries (233 lines)
│   │
│   └── middleware/               # Express middleware
│       ├── auth.js               # Basic auth for admin (57 lines)
│       └── rateLimit.js          # Rate limiting setup (71 lines)
│
├── public/                       # Static files
│   └── admin.html                # Admin dashboard UI (417 lines)
│
├── tests/
│   └── example.test.js           # Dependency verification (50 lines)
│
├── .env.example                  # Environment variable template
├── .gitignore                    # Git ignore rules
├── package.json                  # NPM dependencies
├── Procfile                      # Railway/Heroku deployment
├── README.md                     # Full documentation (364 lines)
├── QUICKSTART.md                 # 15-minute setup guide (368 lines)
├── DEPLOYMENT.md                 # Production deployment (471 lines)
└── PROJECT_STRUCTURE.md          # This file
```

---

## Core Files

### `src/index.js` - Express Server (178 lines)

**Purpose**: Main application server and route definitions.

**Key Features**:
- Express.js setup with middleware
- Route definitions:
  - `POST /whatsapp/webhook` - Receive WhatsApp messages
  - `GET /admin` - Admin dashboard (basic auth)
  - `GET /admin/data` - Dashboard metrics JSON
  - `GET /health` - Health check
  - `GET /api/users` - All users list
  - `GET /api/conversations/:phoneNumber` - User's message history
  - `GET /api/mpesa/transactions` - M-Pesa transactions
- Error handling and 404 routes
- Graceful shutdown on SIGTERM/SIGINT
- CORS configuration
- Rate limiting middleware application

**Dependencies**:
- `express`
- `dotenv`
- All handlers and services
- All middleware

---

### `src/config/firebase.js` - Firebase Setup (36 lines)

**Purpose**: Initialize Firebase Admin SDK for Firestore access.

**Key Features**:
- Parse Firebase credentials from environment variables
- Handle private key newline escaping
- Initialize admin SDK
- Export Firestore database instance
- Error handling with process exit

**Exports**:
```javascript
module.exports = {
  admin,  // Firebase Admin SDK instance
  db,     // Firestore database
};
```

**Firestore Collections Used**:
- `users` - User profiles (keyed by phone)
- `conversations` - Message collections per user
- `mpesa_transactions` - Payment records

---

## Handler Files

### `src/handlers/whatsapp.js` - WhatsApp Integration (186 lines)

**Purpose**: Process incoming WhatsApp messages from Twilio.

**Key Functions**:

| Function | Purpose |
|----------|---------|
| `handleWebhook(req, res)` | Main webhook handler |
| `sendWhatsAppMessage(phone, text)` | Send message via Twilio |
| `checkRateLimit(phone)` | Verify user quota |
| `verifyTwilioRequest(req, token)` | Validate webhook signature |
| `extractPhoneNumber(req)` | Parse from Twilio payload |
| `extractMessageText(req)` | Parse message text |

**Message Flow**:
1. Receive POST from Twilio
2. Extract phone number and message
3. Verify Twilio signature (optional)
4. Check user rate limit (30/hour)
5. Get or create user in Firestore
6. Retrieve conversation history
7. Call Claude with context
8. Store both user and assistant messages
9. Send response back via Twilio

**Rate Limit Logic**:
- Counts user messages per hour
- Rejects if >= 30 messages/hour
- Returns message in user's language

---

### `src/handlers/claude.js` - Claude AI Integration (126 lines)

**Purpose**: Call Claude API with conversation context.

**Key Functions**:

| Function | Purpose |
|----------|---------|
| `getClaudeResponse(msg, history, phone)` | Call Claude API |
| `detectSwahili(text)` | Detect language |
| `isMPesaRequest(text)` | Check if payment-related |

**System Prompt**:
```
You are AfriClaw, an AI assistant for Africa/Kenya
- Respond in user's language (English/Swahili)
- Keep under 200 words
- Helpful with local issues
- Mention you're AI, not human
```

**Language Detection**:
- Checks for Swahili keywords: "habari", "asante", "ndiyo", etc.
- Falls back to English if not detected

**Claude Model**: `claude-3-5-sonnet-20241022`
**Max Tokens**: 1024 per response

**Error Handling**:
- Catches API errors
- Returns fallback message in detected language
- Logs errors with context

---

### `src/handlers/mpesa.js` - M-Pesa Integration (213 lines)

**Purpose**: Handle M-Pesa payment flows via Safaricom Daraja API.

**Key Functions**:

| Function | Purpose |
|----------|---------|
| `getMPesaAccessToken()` | Get OAuth token from Daraja |
| `initiateSTKPush(phone, amount, ref)` | Send payment prompt |
| `checkBalance()` | Query account balance |
| `storeTransaction(phone, data)` | Save to Firestore |
| `handleMPesaCallback(req, res)` | Process payment result |

**Payment Flow**:
1. User says "pay" or "lipa"
2. App detects keyword
3. Initiate STK Push (pop-up)
4. User enters M-Pesa PIN
5. Daraja API processes transaction
6. Callback webhook returns result
7. Store transaction in Firestore
8. Send confirmation via WhatsApp

**STK Push Parameters**:
- `BusinessShortCode`: Safaricom shortcode
- `Amount`: Transaction amount
- `PartyA`: Customer phone (254712345678 format)
- `CallBackURL`: Your webhook URL
- `AccountReference`: Transaction ID

**Transaction Storage**:
- Stored in `mpesa_transactions` collection
- Status: pending → success/failed
- Includes: phone, amount, timestamp, result code

---

## Service Files

### `src/services/userService.js` - User Management (116 lines)

**Purpose**: User CRUD operations and metadata management.

**Key Functions**:

| Function | Returns | Purpose |
|----------|---------|---------|
| `getOrCreateUser(phone)` | User object | Auto-create if new |
| `getUser(phone)` | User \| null | Retrieve user |
| `updateLastMessageTime(phone)` | void | Update timestamp |
| `updateUserLanguage(phone, lang)` | void | Set preferred lang |
| `updateUserPreferences(phone, prefs)` | void | Update settings |
| `getAllUsers()` | Array | All users (admin) |
| `getActiveUsersLast24h()` | Array | Active users |

**User Schema** (Firestore):
```javascript
{
  phoneNumber: "+254712345678",
  userId: "uuid",
  createdAt: "2024-05-01T...",
  lastMessageAt: "2024-05-01T...",
  language: "en" | "sw",
  conversationCount: 5,
  totalMessages: 25,
  preferences: {
    autoRespond: true,
    notifications: true
  }
}
```

---

### `src/services/messageService.js` - Message Storage (146 lines)

**Purpose**: Store and retrieve conversation history.

**Key Functions**:

| Function | Returns | Purpose |
|----------|---------|---------|
| `storeMessage(phone, role, text, meta)` | Message object | Save message |
| `getConversationHistory(phone, limit)` | Array | Last N messages |
| `getTodayMessageCount(phone)` | number | Today's count |
| `getConversationSummary(phone)` | Object | Recent metadata |
| `deleteOldMessages(phone, days)` | void | Cleanup (90 days) |

**Message Schema**:
```javascript
{
  id: "msg_uuid",
  role: "user" | "assistant",
  content: "Message text",
  timestamp: "2024-05-01T...",
  createdAt: 1714560000  // Unix timestamp
}
```

**Firestore Structure**:
```
conversations/
  {phoneNumber}/
    messages/
      {messageId}/
        role: "user" | "assistant"
        content: "..."
        timestamp: "..."
```

---

### `src/services/dashboardService.js` - Analytics (233 lines)

**Purpose**: Provide metrics for admin dashboard.

**Key Functions**:

| Function | Returns | Purpose |
|----------|---------|---------|
| `getTotalUsers()` | number | Total registered |
| `getTodayMessageCount()` | number | Messages today |
| `getActiveUsersLast24h()` | number | Active count |
| `getRecentConversations(limit)` | Array | Recent chats |
| `getTodayMPesaTransactions()` | Array | Today's payments |
| `getMPesaTransactionSummary()` | Object | Payment stats |
| `getDashboardData()` | Object | All metrics combined |

**Dashboard Data Structure**:
```javascript
{
  summary: {
    totalUsers: 150,
    todayMessages: 342,
    activeUsers: 45
  },
  mpesa: {
    total: 12,
    successful: 11,
    failed: 1,
    totalAmount: 25000,  // KES
    averageAmount: 2273
  },
  recentConversations: [
    {
      phoneNumber: "+254...",
      lastMessage: "Hello...",
      lastMessageTime: "2024-05-01T...",
      totalMessages: 25,
      createdAt: "2024-04-01T..."
    }
  ],
  generatedAt: "2024-05-01T18:45:00.000Z"
}
```

---

## Middleware Files

### `src/middleware/auth.js` - Authentication (57 lines)

**Purpose**: Protect admin endpoints with basic HTTP auth.

**Functions**:

| Function | Purpose |
|----------|---------|
| `basicAuth(req, res, next)` | Verify admin credentials |
| `requestLogger(req, res, next)` | Log all requests |

**Authentication Flow**:
1. Client sends `Authorization: Basic base64(admin:password)`
2. Server decodes base64
3. Validates username == "admin" and password == ADMIN_PASSWORD
4. Returns 401 if invalid
5. Next handler if valid

**HTTP Status Codes**:
- `200` - Authenticated, proceed
- `401` - Missing/invalid credentials
- `401` - Invalid base64 format

---

### `src/middleware/rateLimit.js` - Rate Limiting (71 lines)

**Purpose**: Prevent abuse with multiple rate limiting strategies.

**Limiters**:

| Limiter | Window | Max | Purpose |
|---------|--------|-----|---------|
| `apiLimiter` | 15 min | 100 | General API |
| `whatsappLimiter` | 1 min | 60 | Webhook (lenient) |
| `mPesaLimiter` | 1 min | 1000 | Payment callback |
| `adminLimiter` | 15 min | 50 | Admin dashboard |

**Per-User Rate Limiting** (WhatsApp):
- Implemented in `whatsapp.js` handler
- 30 messages per hour per user
- Checks in Firestore

**Rate Limit Headers**:
```
RateLimit-Limit: 100
RateLimit-Remaining: 87
RateLimit-Reset: 1714573200
```

---

## Frontend Files

### `public/admin.html` - Dashboard UI (417 lines)

**Purpose**: Real-time admin dashboard with metrics and monitoring.

**Features**:
- Dark theme with green neon styling
- Real-time data refresh (30 seconds)
- Responsive mobile design
- Authentication required (basic auth)

**Sections**:

1. **Summary Cards**:
   - Total Users
   - Today's Messages
   - Active Users (24h)

2. **M-Pesa Summary**:
   - Total Transactions
   - Successful / Failed
   - Total Amount (KES)
   - Average Amount

3. **Recent Conversations Table**:
   - Phone Number
   - Last Message Preview
   - Last Message Time
   - Total Messages Count

**Styling**:
- Dark background: `#1a1a2e`
- Green accent: `#00ff00`
- Neon glow effects
- Glass-morphism cards
- Mobile responsive

**JavaScript Features**:
- Auto-refresh every 30 seconds
- Manual refresh button
- Error handling with displays
- Timestamp tracking

---

## Configuration Files

### `.env.example` - Environment Template

Contains all required environment variables organized by service:

**Categories**:
1. Express Server (PORT, NODE_ENV)
2. Twilio WhatsApp (credentials, phone)
3. Anthropic Claude (API key)
4. Firebase (full service account)
5. M-Pesa Daraja (credentials)
6. Admin Dashboard (password)
7. Rate Limiting (thresholds)

### `package.json` - Dependencies

**Production**:
```json
{
  "express": "^4.18.2",
  "dotenv": "^16.3.1",
  "twilio": "^4.10.0",
  "@anthropic-ai/sdk": "^0.16.1",
  "firebase-admin": "^12.0.0",
  "axios": "^1.6.2",
  "express-rate-limit": "^7.1.5",
  "uuid": "^9.0.1",
  "moment": "^2.29.4"
}
```

**Development**:
```json
{
  "nodemon": "^3.0.2",
  "prettier": "^3.1.1"
}
```

### `Procfile` - Deployment Config

```
web: npm start
```

Used by:
- Railway.app
- Heroku
- Any Procfile-aware platform

---

## Data Models

### User Model

```javascript
interface User {
  phoneNumber: string;           // +254712345678
  userId: string;                // UUID
  createdAt: ISO8601;
  lastMessageAt: ISO8601;
  language: "en" | "sw";
  conversationCount: number;
  totalMessages: number;
  preferences: {
    autoRespond: boolean;
    notifications: boolean;
  }
}
```

### Message Model

```javascript
interface Message {
  id: string;                    // UUID
  role: "user" | "assistant";
  content: string;
  timestamp: ISO8601;
  createdAt: number;             // Unix timestamp
}
```

### M-Pesa Transaction Model

```javascript
interface Transaction {
  CheckoutRequestID: string;
  phoneNumber: string;
  amount: number;
  status: "pending" | "success" | "failed";
  resultCode: number;
  resultDesc: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}
```

---

## API Endpoints

### Public Endpoints

```
GET /health
├── Returns: { status: "OK", service: "AfriClaw", timestamp: ISO8601 }
├── Auth: None
└── Usage: Health check

POST /whatsapp/webhook
├── Receives: Twilio webhook payload
├── Auth: Twilio signature (optional)
└── Processing: Message handling flow

POST /mpesa/callback
├── Receives: M-Pesa transaction result
├── Auth: Optional token verification
└── Processing: Payment confirmation
```

### Protected Endpoints (Basic Auth)

```
GET /admin
├── Returns: HTML dashboard
├── Auth: admin / ADMIN_PASSWORD
└── Usage: Admin dashboard UI

GET /admin/data
├── Returns: JSON { summary, mpesa, recentConversations, ... }
├── Auth: admin / ADMIN_PASSWORD
└── Usage: Dashboard data API

GET /api/users
├── Returns: { users: [...] }
├── Auth: admin / ADMIN_PASSWORD
└── Usage: All users list

GET /api/conversations/:phoneNumber
├── Returns: { messages: [...] }
├── Auth: admin / ADMIN_PASSWORD
└── Usage: User's message history

GET /api/mpesa/transactions
├── Returns: { transactions: [...] }
├── Auth: admin / ADMIN_PASSWORD
└── Usage: M-Pesa transaction history
```

---

## Error Handling

### Error Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | Success | Message processed |
| 400 | Bad Request | Malformed payload |
| 401 | Unauthorized | Invalid admin auth |
| 403 | Forbidden | Invalid Twilio signature |
| 404 | Not Found | Wrong endpoint |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Firebase/Claude error |

### Error Logging

All errors logged with `[AfriClaw]` prefix:

```javascript
console.error('[AfriClaw] Firebase error: connection timeout');
```

Patterns:
- **Initialization**: `[AfriClaw] Firebase initialized successfully`
- **Processing**: `[AfriClaw] Calling Claude for user: +254...`
- **Errors**: `[AfriClaw] Error: detailed message`
- **Warnings**: `[AfriClaw] Rate limit exceeded for...`

---

## Security Considerations

### Implemented

✅ Rate limiting (30/hour per user)
✅ Basic auth for admin routes
✅ Environment variables for secrets
✅ Firebase data isolation
✅ Twilio signature verification (disabled by default for dev)
✅ Input validation (message text checks)
✅ Error messages (don't leak sensitive info)
✅ HTTPS in production (via platform)

### Recommended

- [ ] Enable Twilio signature verification in production
- [ ] Use JWT instead of basic auth for API
- [ ] Implement Firebase Row-Level Security
- [ ] Add rate limiting by IP
- [ ] Regular security audits
- [ ] Dependency updates (npm audit)
- [ ] Data encryption at rest (Firebase backup)

---

## Performance Metrics

### Response Times

- WhatsApp message → Claude response: **2-3 seconds**
- Admin dashboard data load: **< 500ms**
- Database queries: **< 200ms** (Firebase)
- Claude API call: **1-2 seconds**

### Limits

- Messages per user per hour: **30**
- Conversation history context: **10 messages**
- Message length: **Unlimited** (WhatsApp handles)
- Claude response tokens: **1024**
- Admin dashboard auto-refresh: **30 seconds**

### Scalability

Current setup handles:
- **1-1000 users**: ✅ Free tier Firebase
- **1000-10k users**: ✅ Blaze plan Firebase
- **10k+ users**: ⚠️ Consider caching, database optimization

---

## Development Workflow

### Adding a Feature

1. Create handler/service file in `src/`
2. Import in `src/index.js`
3. Add route if needed
4. Test with `npm run dev`
5. Watch logs for `[AfriClaw]` messages
6. Commit and push to GitHub

### Debugging

1. Check logs: Look for `[AfriClaw] Error:` messages
2. Verify `.env` variables with `.env.example`
3. Test endpoints manually: `curl http://localhost:3000/health`
4. Monitor Firebase console for data
5. Check Twilio logs for webhook issues

### Testing

```bash
npm test              # Check dependencies
npm run dev           # Start with hot-reload
npm start             # Production mode
```

---

## Deployment Checklist

- [ ] All `.env` variables configured
- [ ] Firebase Firestore collections created
- [ ] Twilio webhook URL set
- [ ] M-Pesa credentials (if enabled)
- [ ] Admin password set securely
- [ ] Domain/SSL certificate ready
- [ ] `.env` in `.gitignore`
- [ ] Dependencies verified: `npm test`
- [ ] Health check working: `GET /health`
- [ ] Admin dashboard accessible
- [ ] Rate limiting configured
- [ ] Error logging configured
- [ ] Monitoring set up (optional)

---

## Support & Troubleshooting

See [README.md](README.md) for troubleshooting and [QUICKSTART.md](QUICKSTART.md) for setup help.

---

**Last Updated**: 2024-05-01
**Version**: 1.0.0
**Architecture**: Node.js/Express + Firebase Firestore
