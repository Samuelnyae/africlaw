const { db } = require('../config/firebase');
const moment = require('moment');

/**
 * Get total number of registered users
 * @returns {Promise<number>} Total users
 */
async function getTotalUsers() {
  try {
    const snapshot = await db.collection('users').count().get();
    return snapshot.data().count;
  } catch (error) {
    console.error(`[AfriClaw] Error getting total users: ${error.message}`);
    return 0;
  }
}

/**
 * Get total messages sent today
 * @returns {Promise<number>} Message count
 */
async function getTodayMessageCount() {
  try {
    const startOfDay = moment().startOf('day').toISOString();
    const snapshot = await db
      .collectionGroup('messages')
      .where('timestamp', '>=', startOfDay)
      .count()
      .get();

    return snapshot.data().count;
  } catch (error) {
    console.error(
      `[AfriClaw] Error getting today message count: ${error.message}`
    );
    return 0;
  }
}

/**
 * Get active users in last 24 hours
 * @returns {Promise<number>} Active user count
 */
async function getActiveUsersLast24h() {
  try {
    const oneDayAgo = moment().subtract(1, 'day').toISOString();
    const snapshot = await db
      .collection('users')
      .where('lastMessageAt', '>=', oneDayAgo)
      .count()
      .get();

    return snapshot.data().count;
  } catch (error) {
    console.error(
      `[AfriClaw] Error getting active users: ${error.message}`
    );
    return 0;
  }
}

/**
 * Get recent conversations for dashboard
 * @param {number} limit - Number of conversations to retrieve
 * @returns {Promise<Array>} Recent conversations
 */
async function getRecentConversations(limit = 10) {
  try {
    const snapshot = await db
      .collection('users')
      .orderBy('lastMessageAt', 'desc')
      .limit(limit)
      .get();

    const conversations = [];

    for (const doc of snapshot.docs) {
      const user = doc.data();
      const lastMessage = await getLastMessageForUser(user.phoneNumber);

      conversations.push({
        phoneNumber: user.phoneNumber,
        lastMessage: lastMessage?.content?.substring(0, 100) || 'No messages',
        lastMessageTime: lastMessage?.timestamp || user.lastMessageAt,
        totalMessages: user.totalMessages || 0,
        createdAt: user.createdAt,
      });
    }

    return conversations;
  } catch (error) {
    console.error(
      `[AfriClaw] Error getting recent conversations: ${error.message}`
    );
    return [];
  }
}

/**
 * Get last message for a user
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise<Object|null>} Last message or null
 */
async function getLastMessageForUser(phoneNumber) {
  try {
    const snapshot = await db
      .collection('conversations')
      .doc(phoneNumber)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    return snapshot.docs[0]?.data() || null;
  } catch (error) {
    console.error(
      `[AfriClaw] Error getting last message: ${error.message}`
    );
    return null;
  }
}

/**
 * Get M-Pesa transactions for today
 * @returns {Promise<Array>} Today's M-Pesa transactions
 */
async function getTodayMPesaTransactions() {
  try {
    const startOfDay = moment().startOf('day').toISOString();
    const snapshot = await db
      .collection('mpesa_transactions')
      .where('createdAt', '>=', startOfDay)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    return snapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error(
      `[AfriClaw] Error getting M-Pesa transactions: ${error.message}`
    );
    return [];
  }
}

/**
 * Get M-Pesa transaction summary for today
 * @returns {Promise<Object>} Transaction statistics
 */
async function getMPesaTransactionSummary() {
  try {
    const transactions = await getTodayMPesaTransactions();

    const successful = transactions.filter((t) => t.status === 'success');
    const failed = transactions.filter((t) => t.status === 'failed');
    const totalAmount = successful.reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      total: transactions.length,
      successful: successful.length,
      failed: failed.length,
      totalAmount,
      averageAmount:
        successful.length > 0 ? totalAmount / successful.length : 0,
    };
  } catch (error) {
    console.error(
      `[AfriClaw] Error getting M-Pesa summary: ${error.message}`
    );
    return {
      total: 0,
      successful: 0,
      failed: 0,
      totalAmount: 0,
      averageAmount: 0,
    };
  }
}

/**
 * Get complete dashboard data
 * @returns {Promise<Object>} All dashboard metrics
 */
async function getDashboardData() {
  try {
    console.log('[AfriClaw] Generating dashboard data');

    const [totalUsers, todayMessages, activeUsers, conversations, mpesaSummary] =
      await Promise.all([
        getTotalUsers(),
        getTodayMessageCount(),
        getActiveUsersLast24h(),
        getRecentConversations(10),
        getMPesaTransactionSummary(),
      ]);

    return {
      summary: {
        totalUsers,
        todayMessages,
        activeUsers,
      },
      mpesa: mpesaSummary,
      recentConversations: conversations,
      generatedAt: moment().toISOString(),
    };
  } catch (error) {
    console.error(`[AfriClaw] Error generating dashboard data: ${error.message}`);
    return {
      summary: { totalUsers: 0, todayMessages: 0, activeUsers: 0 },
      mpesa: {
        total: 0,
        successful: 0,
        failed: 0,
        totalAmount: 0,
        averageAmount: 0,
      },
      recentConversations: [],
      error: error.message,
    };
  }
}

module.exports = {
  getTotalUsers,
  getTodayMessageCount,
  getActiveUsersLast24h,
  getRecentConversations,
  getTodayMPesaTransactions,
  getMPesaTransactionSummary,
  getDashboardData,
};
