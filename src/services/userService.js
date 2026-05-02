const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

/**
 * Get or create a user by WhatsApp phone number
 * @param {string} phoneNumber - WhatsApp phone number (e.g., +254712345678)
 * @returns {Promise<Object>} User object with metadata
 */
async function getOrCreateUser(phoneNumber) {
  const userRef = db.collection('users').doc(phoneNumber);
  const userSnap = await userRef.get();

  if (userSnap.exists) {
    console.log(`[AfriClaw] User found: ${phoneNumber}`);
    return userSnap.data();
  }

  // Create new user
  const newUser = {
    phoneNumber,
    userId: uuidv4(),
    createdAt: moment().toISOString(),
    lastMessageAt: moment().toISOString(),
    language: 'en', // Default to English, can be updated based on messages
    conversationCount: 0,
    totalMessages: 0,
    preferences: {
      autoRespond: true,
      notifications: true,
    },
  };

  await userRef.set(newUser);
  console.log(`[AfriClaw] New user created: ${phoneNumber}`);
  return newUser;
}

/**
 * Update user's last message timestamp
 * @param {string} phoneNumber - WhatsApp phone number
 */
async function updateLastMessageTime(phoneNumber) {
  const userRef = db.collection('users').doc(phoneNumber);
  await userRef.update({
    lastMessageAt: moment().toISOString(),
    totalMessages: admin.firestore.FieldValue.increment(1),
  });
}

/**
 * Get user by phone number
 * @param {string} phoneNumber - WhatsApp phone number
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function getUser(phoneNumber) {
  const userSnap = await db.collection('users').doc(phoneNumber).get();
  return userSnap.exists ? userSnap.data() : null;
}

/**
 * Update user preferences
 * @param {string} phoneNumber - WhatsApp phone number
 * @param {Object} preferences - New preferences object
 */
async function updateUserPreferences(phoneNumber, preferences) {
  const userRef = db.collection('users').doc(phoneNumber);
  await userRef.update({
    preferences: { ...preferences },
  });
  console.log(`[AfriClaw] User preferences updated: ${phoneNumber}`);
}

/**
 * Update user language preference
 * @param {string} phoneNumber - WhatsApp phone number
 * @param {string} language - Language code (en, sw)
 */
async function updateUserLanguage(phoneNumber, language) {
  const userRef = db.collection('users').doc(phoneNumber);
  await userRef.update({ language });
  console.log(`[AfriClaw] User language updated to ${language}: ${phoneNumber}`);
}

/**
 * Get all users (for admin dashboard)
 * @returns {Promise<Array>} Array of all users
 */
async function getAllUsers() {
  const snapshot = await db.collection('users').get();
  return snapshot.docs.map((doc) => doc.data());
}

/**
 * Get active users in last 24 hours (for admin dashboard)
 * @returns {Promise<Array>} Array of active users
 */
async function getActiveUsersLast24h() {
  const oneDayAgo = moment().subtract(1, 'day').toISOString();
  const snapshot = await db
    .collection('users')
    .where('lastMessageAt', '>=', oneDayAgo)
    .get();
  return snapshot.docs.map((doc) => doc.data());
}

module.exports = {
  getOrCreateUser,
  updateLastMessageTime,
  getUser,
  updateUserPreferences,
  updateUserLanguage,
  getAllUsers,
  getActiveUsersLast24h,
};
