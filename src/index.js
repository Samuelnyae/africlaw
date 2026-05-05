require('dotenv').config();
const Sentry = require('@sentry/node');
const express = require('express');
const moment = require('moment');
const pinoHttp = require('pino-http');

// Import middleware
const { requestLogger, basicAuth } = require('./middleware/auth');
const { securityHeaders, requireHttps } = require('./middleware/security');
const logger = require('./utils/logger');
const { metricsMiddleware, metricsHandler } = require('./observability/metrics');
const {
  apiLimiter,
  whatsappLimiter,
  mPesaLimiter,
  adminLimiter,
} = require('./middleware/rateLimit');

// Import handlers
const { handleWebhook } = require('./handlers/whatsapp');
const { handleMPesaCallback } = require('./handlers/mpesa');

// Import services
const { getDashboardData } = require('./services/dashboardService');
const adminRoutes = require('./routes/adminRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
  });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(securityHeaders);
app.use(requireHttps);
app.use(pinoHttp({ logger }));
app.use(metricsMiddleware);
app.use(requestLogger);

// CORS setup
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Homepage - Redirect to admin dashboard
app.get('/', (req, res) => {
  res.redirect('/admin');
  return;
  const mockMode = require('./config/firebase').IS_MOCK_MODE;
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AfriClaw - Africa's AI WhatsApp Assistant</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          color: #ffffff;
          line-height: 1.6;
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: rgba(0, 0, 0, 0.5);
          border: 2px solid #00d97e;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 0 30px rgba(0, 217, 126, 0.2);
        }
        h1 { color: #00d97e; margin-bottom: 10px; font-size: 2.5em; text-shadow: 0 0 10px rgba(0, 217, 126, 0.5); }
        .subtitle { color: #888; margin-bottom: 30px; font-size: 1.1em; }
        .status { 
          background: rgba(0, 217, 126, 0.1);
          border-left: 4px solid #00d97e;
          padding: 15px;
          margin-bottom: 30px;
          border-radius: 4px;
        }
        .status-badge {
          display: inline-block;
          background: #00d97e;
          color: #000;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 0.9em;
          margin-right: 10px;
        }
        .status-badge.mock { background: #ff9800; }
        .endpoints {
          display: grid;
          gap: 20px;
          margin-top: 30px;
        }
        .endpoint {
          background: rgba(0, 217, 126, 0.05);
          border-left: 4px solid #00d97e;
          padding: 15px;
          border-radius: 4px;
          transition: all 0.3s;
        }
        .endpoint:hover { background: rgba(0, 217, 126, 0.1); transform: translateX(5px); }
        .endpoint-method {
          display: inline-block;
          background: #00d97e;
          color: #000;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 0.85em;
          margin-right: 10px;
        }
        .endpoint-path { color: #00d97e; font-family: monospace; font-weight: bold; }
        .endpoint-desc { color: #aaa; margin-top: 8px; font-size: 0.95em; }
        .section-title { color: #00d97e; margin-top: 30px; margin-bottom: 15px; font-size: 1.3em; border-bottom: 2px solid #00d97e; padding-bottom: 10px; }
        .info-box {
          background: rgba(255, 152, 0, 0.1);
          border-left: 4px solid #ff9800;
          padding: 15px;
          margin-top: 20px;
          border-radius: 4px;
        }
        .docs-link {
          display: inline-block;
          background: #00d97e;
          color: #000;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          margin-top: 20px;
          transition: all 0.3s;
        }
        .cta-button {
          display: inline-block;
          background: #00d97e;
          color: #1a1a1a;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin-top: 20px;
          transition: all 0.3s;
          border: none;
          cursor: pointer;
          font-size: 1.1em;
          box-shadow: 0 0 20px rgba(0, 217, 126, 0.3);
        }
        .cta-button:hover { 
          background: #00ff99; 
          transform: scale(1.05);
          box-shadow: 0 0 30px rgba(0, 217, 126, 0.5);
        }
        code { background: rgba(0, 0, 0, 0.5); padding: 2px 6px; border-radius: 3px; color: #00d97e; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 AfriClaw</h1>
        <p class="subtitle">Africa's AI WhatsApp Assistant</p>
        
        <div class="status">
          <span class="status-badge">✓ SERVER RUNNING</span>
          <span class="status-badge ${mockMode ? 'mock' : ''}">
            ${mockMode ? '⚠️ MOCK MODE' : '🔥 PRODUCTION'}
          </span>
          <div style="margin-top: 10px; color: #aaa;">
            ${mockMode ? 
              '<strong>Development Mode:</strong> Running without Firebase. Set FIREBASE_PROJECT_ID to enable real data storage.' :
              '<strong>Production Mode:</strong> Connected to Firebase Firestore'
            }
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="/admin" class="cta-button">📊 View Admin Dashboard</a>
          <p style="margin-top: 10px; color: #888; font-size: 0.9em;">Username: <code>admin</code> | Password: <code>admin</code></p>
        </div>

        <div class="section-title">📍 API Endpoints</div>
        
        <div class="endpoints">
          <div class="endpoint">
            <span class="endpoint-method">GET</span>
            <span class="endpoint-path">/health</span>
            <div class="endpoint-desc">Health check endpoint - returns server status</div>
          </div>

          <div class="endpoint">
            <span class="endpoint-method">POST</span>
            <span class="endpoint-path">/whatsapp/webhook</span>
            <div class="endpoint-desc">Twilio WhatsApp webhook - receives messages from users</div>
          </div>

          <div class="endpoint">
            <span class="endpoint-method">GET</span>
            <span class="endpoint-path">/admin</span>
            <div class="endpoint-desc">Admin dashboard (requires basic auth)<br/>Username: <code>admin</code> | Password: from ADMIN_PASSWORD env var</div>
          </div>

          <div class="endpoint">
            <span class="endpoint-method">GET</span>
            <span class="endpoint-path">/admin/data</span>
            <div class="endpoint-desc">Dashboard metrics API (requires basic auth)</div>
          </div>

          <div class="endpoint">
            <span class="endpoint-method">POST</span>
            <span class="endpoint-path">/mpesa/callback</span>
            <div class="endpoint-desc">M-Pesa payment callback handler</div>
          </div>

          <div class="endpoint">
            <span class="endpoint-method">GET</span>
            <span class="endpoint-path">/api/users</span>
            <div class="endpoint-desc">Get all users (requires basic auth)</div>
          </div>

          <div class="endpoint">
            <span class="endpoint-method">GET</span>
            <span class="endpoint-path">/api/conversations/:phoneNumber</span>
            <div class="endpoint-desc">Get conversation history for user (requires basic auth)</div>
          </div>
        </div>

        <div class="section-title">🚀 Getting Started</div>
        <p>To get started with AfriClaw:</p>
        <ol style="margin-left: 20px; margin-top: 10px; color: #aaa;">
          <li>Read <strong>START_HERE.md</strong> for documentation index</li>
          <li>Follow <strong>QUICKSTART.md</strong> for 15-minute setup</li>
          <li>Get your credentials (Twilio, Claude, Firebase, Safaricom)</li>
          <li>Deploy to production with <strong>DEPLOYMENT.md</strong></li>
        </ol>

        <div class="info-box">
          <strong>📚 Documentation Files:</strong><br/>
          <ul style="margin-left: 20px; margin-top: 10px; color: #aaa;">
            <li><strong>START_HERE.md</strong> - Documentation index (READ THIS FIRST!)</li>
            <li><strong>QUICKSTART.md</strong> - 15-minute local setup</li>
            <li><strong>README.md</strong> - Complete documentation</li>
            <li><strong>DEPLOYMENT.md</strong> - Production deployment guide</li>
            <li><strong>CONFIG_REFERENCE.md</strong> - Environment setup guide</li>
            <li><strong>PROJECT_STRUCTURE.md</strong> - Technical details</li>
          </ul>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #444; color: #666; font-size: 0.9em;">
          <p>Built with ❤️ for Africa | Version 1.0.0 | ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'bot-api',
    timestamp: moment().toISOString(),
  });
});
app.get('/metrics', metricsHandler);

// WhatsApp Webhook
app.post('/whatsapp/webhook', whatsappLimiter, handleWebhook);

// WhatsApp GET verification (Twilio)
app.get('/whatsapp/webhook', (req, res) => {
  console.log('[AfriClaw] WhatsApp webhook verification requested');
  res.sendStatus(200);
});

// M-Pesa Callback Handler
app.post('/mpesa/callback', mPesaLimiter, handleMPesaCallback);

// Admin Dashboard - Protected route
app.get('/admin/data', adminLimiter, basicAuth, async (req, res) => {
  try {
    const dashboardData = await getDashboardData();
    res.json(dashboardData);
  } catch (error) {
    console.error(`[AfriClaw] Admin data endpoint error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Serve admin dashboard HTML
app.get('/admin', adminLimiter, (req, res) => {
  const path = require('path');
  res.sendFile(path.resolve(__dirname, '..', 'public', 'admin.html'));
});

// API endpoint to get all users (for dashboard)
app.get('/api/users', apiLimiter, basicAuth, async (req, res) => {
  try {
    const { getAllUsers } = require('./services/userService');
    const users = await getAllUsers();
    res.json({ users });
  } catch (error) {
    console.error(`[AfriClaw] Get users error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// API endpoint to get user conversations
app.get('/api/conversations/:phoneNumber', apiLimiter, basicAuth, async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const { getConversationHistory } = require('./services/messageService');
    const messages = await getConversationHistory(phoneNumber, 50);
    res.json({ messages });
  } catch (error) {
    console.error(
      `[AfriClaw] Get conversations error: ${error.message}`
    );
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// API endpoint to get M-Pesa transactions (for dashboard)
app.get('/api/mpesa/transactions', apiLimiter, basicAuth, async (req, res) => {
  try {
    const { getTodayMPesaTransactions } = require('./services/dashboardService');
    const transactions = await getTodayMPesaTransactions();
    res.json({ transactions });
  } catch (error) {
    console.error(`[AfriClaw] Get M-Pesa transactions error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Public Firebase web config for admin login.
app.get('/api/admin/auth-config', (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_WEB_API_KEY || '',
    authDomain: process.env.FIREBASE_WEB_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_WEB_PROJECT_ID || '',
    appId: process.env.FIREBASE_WEB_APP_ID || '',
  });
});

// New admin API (Firebase JWT + RBAC protected)
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist',
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`[AfriClaw] Unhandled error: ${err.message}`);
  if (process.env.SENTRY_DSN) Sentry.captureException(err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Server error',
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(
    {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      timestamp: moment().toISOString(),
    },
    'AfriClaw bot-api started'
  );
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[AfriClaw] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[AfriClaw] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[AfriClaw] SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('[AfriClaw] Server closed');
    process.exit(0);
  });
});

// Unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
  console.error(
    `[AfriClaw] Unhandled Rejection at: ${promise}, reason: ${reason}`
  );
});

module.exports = app;
