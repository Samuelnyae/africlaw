const { db } = require('../config/firebase');
const moment = require('moment');

/**
 * Store a message in Firestore
 * @param {string} phoneNumber - User's WhatsApp phone number
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content - Message content
 * @param {Object} metadata - Optional metadata
 */
async function storeMessage(phoneNumber, role, content, metadata = {}) {
  const messageRef = db
    .collection('conversations')
    .doc(phoneNumber)
    .collection('messages')
    .doc();

  const message = {
    id: messageRef.id,
    role,
    content,
    timestamp: moment().toISOString(),
    createdAt: moment().unix(),
    ...metadata,
  };

  await messageRef.set(message);
  console.log(`[AfriClaw] Message stored for ${phoneNumber} (${role})`);
  return message;
}

/**
 * Get last N messages for a user (for context in Claude API)
 * @param {string} phoneNumber - User's WhatsApp phone number
 * @param {number} limit - Number of messages to retrieve (default: 20)
 * @returns {Promise<Array>} Array of message objects
 */
async function getConversationHistory(phoneNumber, limit = 20) {
  try {
    const snapshot = await db
      .collection('conversations')
      .doc(phoneNumber)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    // Reverse to get chronological order
    const messages = snapshot.docs.map((doc) => doc.data()).reverse();
    console.log(
      `[AfriClaw] Retrieved ${messages.length} messages for ${phoneNumber}`
    );
    return messages;
  } catch (error) {
    console.error(
      `[AfriClaw] Error retrieving conversation history: ${error.message}`
    );
    return [];
  }
}

/**
 * Get today's message count for a user (for rate limiting)
 * @param {string} phoneNumber - User's WhatsApp phone number
 * @returns {Promise<number>} Count of messages today
 */
async function getTodayMessageCount(phoneNumber) {
  const startOfDay = moment().startOf('day').toISOString();
  const snapshot = await db
    .collection('conversations')
    .doc(phoneNumber)
    .collection('messages')
    .where('timestamp', '>=', startOfDay)
    .where('role', '==', 'user')
    .get();

  return snapshot.size;
}

/**
 * Get conversation summary (for admin dashboard)
 * @param {string} phoneNumber - User's WhatsApp phone number
 * @returns {Promise<Object>} Conversation metadata
 */
async function getConversationSummary(phoneNumber) {
  const snapshot = await db
    .collection('conversations')
    .doc(phoneNumber)
    .collection('messages')
    .orderBy('createdAt', 'desc')
    .limit(2)
    .get();

  const messages = snapshot.docs.map((doc) => doc.data());
  const lastMessage = messages[0] || null;
  const totalMessages = await db
    .collection('conversations')
    .doc(phoneNumber)
    .collection('messages')
    .count()
    .get();

  return {
    phoneNumber,
    lastMessage: lastMessage?.content.substring(0, 50),
    lastMessageTime: lastMessage?.timestamp,
    totalMessages: totalMessages.data().count,
  };
}

/**
 * Delete old messages (for privacy/cleanup)
 * @param {string} phoneNumber - User's WhatsApp phone number
 * @param {number} daysOld - Delete messages older than X days
 */
async function deleteOldMessages(phoneNumber, daysOld = 90) {
  const cutoffDate = moment()
    .subtract(daysOld, 'days')
    .toISOString();

  const snapshot = await db
    .collection('conversations')
    .doc(phoneNumber)
    .collection('messages')
    .where('timestamp', '<', cutoffDate)
    .get();

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(
    `[AfriClaw] Deleted ${snapshot.size} old messages for ${phoneNumber}`
  );
}

module.exports = {
  storeMessage,
  getConversationHistory,
  getTodayMessageCount,
  getConversationSummary,
  deleteOldMessages,
};
