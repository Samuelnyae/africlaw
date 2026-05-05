const twilio = require('twilio');
const { isMPesaRequest } = require('./claude');
const { getOrCreateUser, updateLastMessageTime } = require('../services/userService');
const {
  storeMessage,
  getConversationHistory,
  getTodayMessageCount,
} = require('../services/messageService');
const { processBrainMessage } = require('../services/brainClient');
const { getSession, setSession } = require('../services/cacheService');
const { messageCounter } = require('../observability/metrics');

// Initialize Twilio client only if credentials are available
let twilioClient = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  console.log('[AfriClaw] Twilio client initialized');
} else {
  console.log('[AfriClaw] Twilio credentials not found - running in mock mode');
}

/**
 * Extract phone number from Twilio webhook
 * @param {Object} req - Express request object
 * @returns {string} Phone number in format +254712345678
 */
function extractPhoneNumber(req) {
  return req.body.From.replace('whatsapp:', '');
}

/**
 * Extract message text from Twilio webhook
 * @param {Object} req - Express request object
 * @returns {string} Message text
 */
function extractMessageText(req) {
  return req.body.Body || '';
}

/**
 * Verify Twilio request is authentic
 * @param {Object} req - Express request object
 * @param {string} token - Twilio auth token
 * @returns {boolean} True if request is valid
 */
function verifyTwilioRequest(req, token) {
  const signature = req.header('x-twilio-signature') || '';
  const url = `${process.env.WEBHOOK_URL || ''}${req.originalUrl}`;

  try {
    return twilio.validateRequest(token, signature, url, req.body);
  } catch (error) {
    console.error('[AfriClaw] Twilio signature verification failed');
    return false;
  }
}

/**
 * Check rate limit for user
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise<boolean>} True if user is within rate limit
 */
async function checkRateLimit(phoneNumber) {
  const limit = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 30;
  const messageCount = await getTodayMessageCount(phoneNumber);

  if (messageCount >= limit) {
    console.log(`[AfriClaw] Rate limit exceeded for ${phoneNumber}`);
    return false;
  }

  return true;
}

/**
 * Send WhatsApp message via Twilio
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} messageText - Message content
 */
async function sendWhatsAppMessage(phoneNumber, messageText) {
  try {
    // In mock mode, skip sending
    if (!twilioClient) {
      console.log(`[AfriClaw] MOCK MODE: Would send message to ${phoneNumber}: ${messageText}`);
      return { sid: 'mock-' + Date.now() };
    }

    const message = await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `whatsapp:${phoneNumber}`,
      body: messageText,
    });

    console.log(
      `[AfriClaw] WhatsApp message sent to ${phoneNumber}: ${message.sid}`
    );
    return message;
  } catch (error) {
    console.error(
      `[AfriClaw] Error sending WhatsApp message: ${error.message}`
    );
    throw error;
  }
}

/**
 * Handle incoming WhatsApp message webhook
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function handleWebhook(req, res) {
  try {
    console.log('[AfriClaw] Incoming WhatsApp webhook received');

    // Verify Twilio signature for webhook security.
    if (process.env.ENFORCE_TWILIO_SIGNATURE === 'true') {
      if (!verifyTwilioRequest(req, process.env.TWILIO_AUTH_TOKEN)) {
        console.error('[AfriClaw] Invalid Twilio signature');
        return res.status(403).send('Forbidden');
      }
    }

    // Extract message details
    const phoneNumber = extractPhoneNumber(req);
    const messageText = extractMessageText(req);

    if (!messageText.trim()) {
      console.log('[AfriClaw] Empty message received');
      messageCounter.inc({ result: 'empty' });
      return res.status(200).send('OK');
    }

    console.log(
      `[AfriClaw] Message from ${phoneNumber}: ${messageText.substring(0, 50)}...`
    );

    // Get or create user
    const user = await getOrCreateUser(phoneNumber);
    console.log(`[AfriClaw] User processed: ${user.userId}`);

    // Check rate limit
    const withinLimit = await checkRateLimit(phoneNumber);
    if (!withinLimit) {
      await sendWhatsAppMessage(
        phoneNumber,
        'Umetumia ujumbe mwingi sana leo. Tafadhali jaribu kesho. (You\'ve sent too many messages today. Please try again tomorrow.)'
      );
      messageCounter.inc({ result: 'rate_limited' });
      return res.status(200).send('OK');
    }

    // Store user message
    await storeMessage(phoneNumber, 'user', messageText);
    await updateLastMessageTime(phoneNumber);

    // Session caching keeps context retrieval lightweight and stateless for pods.
    const cachedSession = await getSession(phoneNumber);
    let conversationHistory = cachedSession?.conversationHistory;
    if (!conversationHistory) {
      conversationHistory = await getConversationHistory(phoneNumber, 10);
      await setSession(phoneNumber, { conversationHistory }, 1800);
    }

    // Check if this is M-Pesa related
    if (isMPesaRequest(messageText)) {
      console.log(`[AfriClaw] M-Pesa request detected from ${phoneNumber}`);
      // M-Pesa handling will be done in separate handler
      await storeMessage(
        phoneNumber,
        'assistant',
        'Karibu kwa M-Pesa! Tunakuandalia kwa malipuko. (Welcome to M-Pesa! We are preparing for payments.)'
      );
      await sendWhatsAppMessage(
        phoneNumber,
        'Karibu kwa M-Pesa! Tunakuandalia kwa malipuko. (Welcome to M-Pesa! We are preparing for payments.)'
      );
      return res.status(200).send('OK');
    }

    const brainPayload = {
      phoneNumber,
      messageText,
      conversationHistory,
      context: {
        localeHint: 'kenya',
        source: 'whatsapp',
      },
      memory: {
        recall: true,
      },
      tools: ['knowledge', 'payments'],
    };

    const brainResult = await processBrainMessage(brainPayload);
    const claudeResponse = brainResult.response;

    // Store assistant response
    await storeMessage(phoneNumber, 'assistant', claudeResponse);

    // Send response back to user
    await sendWhatsAppMessage(phoneNumber, claudeResponse);
    messageCounter.inc({ result: 'success' });

    console.log(`[AfriClaw] Message handled successfully for ${phoneNumber}`);
    return res.status(200).send('OK');
  } catch (error) {
    console.error(`[AfriClaw] Webhook error: ${error.message}`);
    messageCounter.inc({ result: 'error' });
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  handleWebhook,
  sendWhatsAppMessage,
  extractPhoneNumber,
  extractMessageText,
  checkRateLimit,
};
