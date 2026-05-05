require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const pino = require('pino');
const pinoHttp = require('pino-http');
const jwt = require('jsonwebtoken');
const Sentry = require('@sentry/node');
const client = require('prom-client');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.BRAIN_PORT || 4000;
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
  });
}

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

client.collectDefaultMetrics({ prefix: 'africlaw_brain_' });
const processCounter = new client.Counter({
  name: 'africlaw_brain_process_total',
  help: 'Total message processing operations',
  labelNames: ['status'],
});

app.use(express.json());
app.use(helmet());
app.use(pinoHttp({ logger }));

function verifyInternalToken(req, res, next) {
  const token = (req.get('Authorization') || '').replace('Bearer ', '');
  try {
    jwt.verify(token, process.env.INTERNAL_JWT_SECRET || 'dev-internal-secret');
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized internal request' });
  }
}

function buildToolsResponse(messageText, tools = []) {
  const lower = messageText.toLowerCase();
  if (tools.includes('payments') && (lower.includes('mpesa') || lower.includes('pay'))) {
    return 'To use M-Pesa, share recipient number and amount. I can guide you through secure payment steps.';
  }
  return null;
}

app.post('/process-message', verifyInternalToken, async (req, res) => {
  try {
    const payload = req.body || {};
    const {
      messageText = '',
      conversationHistory = [],
      context = {},
      memory = {},
      tools = [],
    } = payload;

    // Memory recall and context injection are combined in prompt assembly.
    const recalled = memory.recall
      ? conversationHistory.slice(-6).map((m) => `${m.role}: ${m.content}`).join('\n')
      : '';
    const contextBlock = Object.keys(context)
      .map((k) => `${k}: ${context[k]}`)
      .join('\n');
    const toolResponse = buildToolsResponse(messageText, tools);

    let response = toolResponse;
    if (!response && anthropic) {
      const completion = await anthropic.messages.create({
        model: process.env.BRAIN_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 512,
        system:
          'You are the AfriClaw brain service. Return concise WhatsApp-safe responses.',
        messages: [
          {
            role: 'user',
            content: `Context:\n${contextBlock}\n\nMemory:\n${recalled}\n\nUser: ${messageText}`,
          },
        ],
      });
      response = completion.content?.[0]?.text;
    }

    if (!response) {
      response = 'Hello! I am AfriClaw. How can I help you today?';
    }

    processCounter.inc({ status: 'success' });
    return res.status(200).json({
      response,
      metadata: {
        memoryUsed: Boolean(memory.recall),
        contextInjected: Boolean(contextBlock),
        toolsEvaluated: tools,
      },
    });
  } catch (error) {
    processCounter.inc({ status: 'error' });
    if (process.env.SENTRY_DSN) Sentry.captureException(error);
    return res.status(500).json({ error: 'Brain processing failed' });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'brain-service',
    timestamp: new Date().toISOString(),
  });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Brain service started');
});
