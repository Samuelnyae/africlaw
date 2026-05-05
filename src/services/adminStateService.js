const os = require('os');
const moment = require('moment');
const { db, IS_MOCK_MODE } = require('../config/firebase');
const { getDashboardData, getActiveUsersLast24h } = require('./dashboardService');
const { getAllUsers } = require('./userService');
const { getConversationHistory } = require('./messageService');

const brainConfig = {
  systemPrompt:
    'You are the AfriClaw brain service. Return concise WhatsApp-safe responses.',
  temperature: 0.4,
  tools: {
    knowledge: true,
    payments: true,
    memory: true,
  },
  aiMode: 'assistant',
};

const appSettings = {
  webhookSecret: process.env.WEBHOOK_TOKEN || '',
  rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || '30',
  maintenanceMode: false,
  featureFlags: {
    brainService: true,
    broadcast: true,
    autoReply: true,
  },
  whatsappApiConfig: {
    webhookUrl: process.env.WEBHOOK_URL || '',
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  },
};

const adminAuditLogs = [];
const userTags = new Map();
const blockedUsers = new Set();
const flaggedConversations = new Set();

function addAuditLog(entry) {
  const event = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: moment().toISOString(),
    ...entry,
  };
  adminAuditLogs.unshift(event);
  if (adminAuditLogs.length > 500) adminAuditLogs.pop();
}

function getMaskedSettings() {
  return {
    ...appSettings,
    webhookSecret: appSettings.webhookSecret ? '********' : '',
  };
}

async function getOverview() {
  const dashboard = await getDashboardData();
  const activeUsers = await getActiveUsersLast24h();
  const totalUsers = dashboard.summary?.totalUsers || 0;
  const todayMessages = dashboard.summary?.todayMessages || 0;
  const uptimeSec = process.uptime();
  const structuredLogs = adminAuditLogs.slice(0, 40);

  return {
    totalUsers,
    activeConversations: activeUsers,
    messagesToday: todayMessages,
    brainResponseTimeMs: 420,
    errorRate: 0.02,
    uptimeSeconds: Math.floor(uptimeSec),
    lineChart: Array.from({ length: 7 }).map((_, i) => ({
      day: moment().subtract(6 - i, 'days').format('ddd'),
      messages: Math.max(5, Math.floor(todayMessages / 7) + i * 3),
    })),
    barChart: [
      { label: 'Brain', value: 58 },
      { label: 'Payments', value: 17 },
      { label: 'Support', value: 25 },
    ],
    logsMonitoring: {
      logs: structuredLogs,
      errors: structuredLogs.filter((l) => l.level === 'error'),
      apiResponseMs: 140,
      redisStatus: process.env.REDIS_URL ? 'connected' : 'disabled',
      systemMetrics: {
        memoryRssMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        loadAvg: os.loadavg()[0],
      },
    },
  };
}

async function getUsersPage({ page = 1, pageSize = 10, search = '' }) {
  const users = await getAllUsers();
  const normalized = search.trim().toLowerCase();

  const filtered = users
    .filter((u) =>
      normalized ? (u.phoneNumber || '').toLowerCase().includes(normalized) : true
    )
    .map((u) => ({
      ...u,
      blocked: blockedUsers.has(u.phoneNumber),
      tags: userTags.get(u.phoneNumber) || [],
    }));

  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return {
    items: paged,
    total: filtered.length,
    page,
    pageSize,
  };
}

async function getConversationsPage({ page = 1, pageSize = 10, search = '' }) {
  const users = await getAllUsers();
  const normalized = search.trim().toLowerCase();
  const filtered = users.filter((u) =>
    normalized ? (u.phoneNumber || '').toLowerCase().includes(normalized) : true
  );

  const start = (page - 1) * pageSize;
  const pagedUsers = filtered.slice(start, start + pageSize);

  const items = await Promise.all(
    pagedUsers.map(async (u) => {
      const messages = await getConversationHistory(u.phoneNumber, 1);
      const last = messages[messages.length - 1];
      return {
        phoneNumber: u.phoneNumber,
        lastMessage: last?.content || '',
        lastMessageAt: last?.timestamp || u.lastMessageAt,
        flagged: flaggedConversations.has(u.phoneNumber),
      };
    })
  );

  return {
    items,
    total: filtered.length,
    page,
    pageSize,
  };
}

async function getConversationThread(phoneNumber) {
  const messages = await getConversationHistory(phoneNumber, 100);
  return {
    phoneNumber,
    messages,
    flagged: flaggedConversations.has(phoneNumber),
    blocked: blockedUsers.has(phoneNumber),
    tags: userTags.get(phoneNumber) || [],
  };
}

async function resetUserMemory(phoneNumber) {
  if (IS_MOCK_MODE) return { cleared: true };
  const snapshot = await db
    .collection('conversations')
    .doc(phoneNumber)
    .collection('messages')
    .get();

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  return { cleared: true, deletedCount: snapshot.size };
}

module.exports = {
  brainConfig,
  appSettings,
  addAuditLog,
  getMaskedSettings,
  getOverview,
  getUsersPage,
  getConversationsPage,
  getConversationThread,
  resetUserMemory,
  userTags,
  blockedUsers,
  flaggedConversations,
  adminAuditLogs,
};
