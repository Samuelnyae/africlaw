# AfriClaw - Africa's AI WhatsApp Assistant

A powerful WhatsApp chatbot powered by Claude AI, designed to serve Kenyan and African users in Swahili and English. Features M-Pesa integration for payments, conversation history, rate limiting, and an admin dashboard.

## Features

- **WhatsApp Integration**: Seamless Twilio-powered WhatsApp messaging
- **Claude AI**: Advanced conversational AI with context awareness
- **Bilingual Support**: Automatic Swahili/English language detection
- **M-Pesa Integration**: STK Push payment requests (Safaricom Daraja)
- **Conversation History**: Firebase Firestore persistence with full context
- **Rate Limiting**: 30 messages/hour per user protection
- **Admin Dashboard**: Real-time analytics and conversation monitoring
- **Secure**: Basic auth protection, request verification, error handling
- **Scalable**: Cloud-ready deployment (Railway, Vercel, etc.)

## System Requirements

- Node.js 18.x or higher
- npm or pnpm package manager
- Firebase account with Firestore
- Twilio account with WhatsApp Business API access
- Anthropic Claude API key
- Safaricom M-Pesa Daraja credentials (optional, for payments)

## Installation

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/yourusername/africlaw.git
cd africlaw
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in all required values:

```bash
cp .env.example .env
nano .env  # Edit with your credentials
```

Required variables:
- `TWILIO_ACCOUNT_SID` - From Twilio Console
- `TWILIO_AUTH_TOKEN` - From Twilio Console
- `TWILIO_PHONE_NUMBER` - Your WhatsApp sandbox/business number
- `ANTHROPIC_API_KEY` - From Anthropic API dashboard
- `FIREBASE_*` - From Firebase service account JSON
- `MPESA_CONSUMER_KEY` - From Safaricom Daraja
- `MPESA_CONSUMER_SECRET` - From Safaricom Daraja
- `MPESA_SHORTCODE` - Your Safaricom shortcode
- `MPESA_PASSKEY` - From Safaricom Daraja
- `ADMIN_PASSWORD` - For admin dashboard access

### 3. Set Up Firebase

1. Create a Firebase project: https://console.firebase.google.com
2. Enable Firestore Database
3. Create service account:
   - Go to Settings → Service Accounts
   - Click "Generate New Private Key"
   - Download JSON and extract values into `.env`

4. Create Firestore collections:
   ```javascript
   // Collections to create in Firestore:
   - users (documents keyed by phone number)
   - conversations (documents keyed by phone number, with messages subcollection)
   - mpesa_transactions (documents for transaction records)
   ```

### 4. Set Up Twilio

1. Create account at https://www.twilio.com
2. Get WhatsApp Business Account or use sandbox
3. Copy `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` to `.env`
4. Get WhatsApp phone number and set as `TWILIO_PHONE_NUMBER`

### 5. Configure Anthropic API

1. Sign up at https://console.anthropic.com
2. Create API key
3. Set `ANTHROPIC_API_KEY` in `.env`

### 6. Set Up M-Pesa (Optional)

1. Register for Safaricom Daraja: https://developer.safaricom.co.ke
2. Create app and get credentials
3. Use sandbox for testing, production when ready
4. Set M-Pesa environment variables in `.env`

## Local Development

### Start Dev Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Test With ngrok

```bash
# In another terminal
ngrok http 3000
```

Get public URL and update:
- Twilio webhook: `https://your-ngrok-url/whatsapp/webhook`
- M-Pesa callback: `https://your-ngrok-url/mpesa/callback`

### Test Message Flow

Send WhatsApp message to your Twilio sandbox number:
- Should receive Claude response within 5 seconds
- Message stored in Firestore `conversations` collection
- View logs in terminal

## API Endpoints

### WhatsApp Webhook
```
POST /whatsapp/webhook
- Receives messages from Twilio
- Handles user creation, rate limiting, Claude response
```

### Admin Dashboard
```
GET /admin
- Requires basic auth (admin / ADMIN_PASSWORD)
- Real-time metrics and conversation monitoring
```

### Admin APIs
```
GET /admin/data - Dashboard metrics
GET /api/users - All users
GET /api/conversations/:phoneNumber - User's messages
GET /api/mpesa/transactions - Today's M-Pesa transactions
```

### Health Check
```
GET /health - Service status
```

## Message Flow

```
User sends WhatsApp → Twilio webhook → AfriClaw
↓
Validate signature & extract phone
↓
Check rate limit (30 msgs/hour)
↓
Get/create user in Firestore
↓
Retrieve last 10 messages for context
↓
Call Claude API with context
↓
Store user message & response
↓
Send response back to user via WhatsApp
```

## M-Pesa Payment Flow

```
User: "Send 100 KES"
↓
AfriClaw detects payment keyword
↓
Initiates M-Pesa STK Push (pop-up on phone)
↓
User enters M-Pesa PIN
↓
Daraja callback webhook returns result
↓
AfriClaw sends confirmation via WhatsApp
↓
Transaction stored in Firestore
```

## Admin Dashboard

Access at `http://localhost:3000/admin` (or `https://your-domain/admin`)

Default credentials:
- Username: `admin`
- Password: value of `ADMIN_PASSWORD` env var

Features:
- Total users registered
- Today's message count
- Active users (24h)
- M-Pesa transaction summary
- Recent conversation feed
- Auto-refresh every 30 seconds

## Deployment

### Railway.app (Recommended)

```bash
# Install Railway CLI
npm install -g railway

# Login and create project
railway login
railway init

# Set environment variables in Railway dashboard
# Then deploy
railway up
```

### Vercel

1. Connect GitHub repo
2. Set environment variables in Vercel settings
3. Deploy (Node.js detection automatic)

### Heroku

```bash
heroku login
heroku create africlaw
heroku config:set ANTHROPIC_API_KEY=your_key
# ... set all env vars
git push heroku main
```

### Docker

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
COPY public ./public
CMD ["npm", "start"]
```

## Rate Limiting

Default: 30 messages per hour per user

Configure in `.env`:
```
RATE_LIMIT_MAX_REQUESTS=30
RATE_LIMIT_WINDOW_MS=3600000  # 1 hour in ms
```

User receives message when limit exceeded:
- Swahili: "Umetumia ujumbe mwingi sana leo. Tafadhali jaribu kesho."
- English: "You've sent too many messages today. Please try again tomorrow."

## Logging

All actions logged with `[AfriClaw]` prefix:

```
[AfriClaw] User found: +254712345678
[AfriClaw] Message from +254712345678: Hello
[AfriClaw] Calling Claude for user: +254712345678
[AfriClaw] Claude response generated
[AfriClaw] WhatsApp message sent
```

## Troubleshooting

### "Invalid Twilio signature"
- Ensure `TWILIO_AUTH_TOKEN` is correct
- Signature verification disabled by default in code (enable in production)

### Firebase connection errors
- Verify service account JSON credentials
- Check Firebase project ID matches `.env`
- Ensure Firestore is enabled in Firebase

### Claude API errors
- Check `ANTHROPIC_API_KEY` is valid
- Monitor API usage in Anthropic console
- 1024 token response limit per message

### M-Pesa STK Push not working
- Use Safaricom Daraja sandbox for testing
- Verify phone number format: 254712345678 (without +)
- Check Daraja credentials and shortcode

### No messages being received
- Verify Twilio webhook URL is correct and public
- Check ngrok URL hasn't changed (restarts every 8 hours)
- Ensure WhatsApp number is in Twilio sandbox
- Check Express server logs for errors

## Security Considerations

1. **Environment Variables**: Never commit `.env` to Git
2. **Admin Auth**: Strong password for `ADMIN_PASSWORD`
3. **Rate Limiting**: Prevents abuse and API cost overruns
4. **Firebase RLS**: Consider enabling Row-Level Security
5. **API Keys**: Rotate credentials periodically
6. **HTTPS Only**: Use in production (Railway/Vercel provide)
7. **Data Retention**: Implement message deletion policy (90 days default)

## Performance Tips

- Firebase: Use regional endpoints
- Claude: Cache conversation history (currently last 10 messages)
- WhatsApp: Response time typically 2-3 seconds
- Rate limiting: Prevents spike charges
- Admin dashboard: Auto-refreshes every 30 seconds

## Future Enhancements

Phase 2:
- Voice message transcription (Twilio)
- Image recognition and processing
- Payment status tracking
- User preference learning
- Advanced analytics
- Multi-language expansion

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## License

MIT License - See LICENSE file

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review logs in Express console
3. Verify all env variables are set
4. Check Twilio/Firebase/Anthropic dashboards
5. Open GitHub issue with detailed error logs

## Credits

Built with:
- [Express.js](https://expressjs.com) - Web server
- [Twilio](https://twilio.com) - WhatsApp messaging
- [Anthropic Claude](https://anthropic.com) - AI conversations
- [Firebase](https://firebase.google.com) - Database
- [Safaricom Daraja](https://developer.safaricom.co.ke) - M-Pesa

---

**AfriClaw © 2024** - Empowering Africa with AI
