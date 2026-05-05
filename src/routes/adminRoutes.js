const express = require('express');
const { adminLimiter } = require('../middleware/rateLimit');
const {
  requireFirebaseJwt,
  authorizeRoles,
  enforceSessionTimeout,
} = require('../middleware/adminAuth');
const {
  addAuditLog,
  getOverview,
  getUsersPage,
  getConversationsPage,
  getConversationThread,
  brainConfig,
  appSettings,
  getMaskedSettings,
  userTags,
  blockedUsers,
  flaggedConversations,
  resetUserMemory,
  adminAuditLogs,
} = require('../services/adminStateService');
const { storeMessage } = require('../services/messageService');
const { sendWhatsAppMessage } = require('../handlers/whatsapp');

const router = express.Router();

// Wrapper to catch async errors in Express routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.use(adminLimiter, requireFirebaseJwt, enforceSessionTimeout);

router.get('/overview', authorizeRoles('admin', 'operator', 'viewer'), asyncHandler(async (req, res) => {
  const data = await getOverview();
  return res.json(data);
}));

router.get('/users', authorizeRoles('admin', 'operator', 'viewer'), asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page || '1', 10);
  const pageSize = parseInt(req.query.pageSize || '10', 10);
  const search = req.query.search || '';
  const data = await getUsersPage({ page, pageSize, search });
  return res.json(data);
}));

router.patch('/users/:phoneNumber', authorizeRoles('admin', 'operator'), (req, res) => {
  const { phoneNumber } = req.params;
  const { blocked, tags } = req.body || {};

  if (typeof blocked === 'boolean') {
    if (blocked) blockedUsers.add(phoneNumber);
    else blockedUsers.delete(phoneNumber);
  }

  if (Array.isArray(tags)) {
    userTags.set(phoneNumber, tags.slice(0, 10));
  }

  addAuditLog({
    actor: req.adminAuth?.sub,
    role: req.adminRole,
    action: 'users.update',
    target: phoneNumber,
    details: { blocked, tags },
    level: 'info',
  });

  return res.json({ success: true });
});

router.get(
  '/conversations',
  authorizeRoles('admin', 'operator', 'viewer'),
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '10', 10);
    const search = req.query.search || '';
    const data = await getConversationsPage({ page, pageSize, search });
    return res.json(data);
  })
);

router.get(
  '/conversations/:phoneNumber',
  authorizeRoles('admin', 'operator', 'viewer'),
  asyncHandler(async (req, res) => {
    const data = await getConversationThread(req.params.phoneNumber);
    return res.json(data);
  })
);

router.post(
  '/conversations/:phoneNumber/override-reply',
  authorizeRoles('admin', 'operator'),
  asyncHandler(async (req, res) => {
    const { phoneNumber } = req.params;
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message is required' });

    await storeMessage(phoneNumber, 'assistant', message, { source: 'manual_override' });
    await sendWhatsAppMessage(phoneNumber, message);

    addAuditLog({
      actor: req.adminAuth?.sub,
      role: req.adminRole,
      action: 'conversation.override_reply',
      target: phoneNumber,
      details: { message },
      level: 'warn',
    });

    return res.json({ success: true });
  })
);

router.post(
  '/conversations/:phoneNumber/flag',
  authorizeRoles('admin', 'operator'),
  (req, res) => {
    const { phoneNumber } = req.params;
    flaggedConversations.add(phoneNumber);

    addAuditLog({
      actor: req.adminAuth?.sub,
      role: req.adminRole,
      action: 'conversation.flag',
      target: phoneNumber,
      level: 'warn',
    });
    return res.json({ success: true });
  }
);

router.post(
  '/conversations/:phoneNumber/reset-memory',
  authorizeRoles('admin'),
  asyncHandler(async (req, res) => {
    const { phoneNumber } = req.params;
    const result = await resetUserMemory(phoneNumber);
    addAuditLog({
      actor: req.adminAuth?.sub,
      role: req.adminRole,
      action: 'conversation.reset_memory',
      target: phoneNumber,
      details: result,
      level: 'warn',
    });
    return res.json({ success: true, result });
  })
);

router.get('/brain', authorizeRoles('admin', 'operator', 'viewer'), (req, res) => {
  return res.json({ ...brainConfig });
});

router.patch('/brain', authorizeRoles('admin', 'operator'), (req, res) => {
  const { systemPrompt, temperature, tools, aiMode } = req.body || {};

  if (typeof systemPrompt === 'string') brainConfig.systemPrompt = systemPrompt;
  if (typeof temperature === 'number') brainConfig.temperature = temperature;
  if (tools && typeof tools === 'object') {
    brainConfig.tools = { ...brainConfig.tools, ...tools };
  }
  if (typeof aiMode === 'string') brainConfig.aiMode = aiMode;

  addAuditLog({
    actor: req.adminAuth?.sub,
    role: req.adminRole,
    action: 'brain.update',
    details: { systemPrompt: Boolean(systemPrompt), temperature, tools, aiMode },
    level: 'info',
  });

  return res.json({ success: true, brainConfig });
});

router.post('/brain/test', authorizeRoles('admin', 'operator'), (req, res) => {
  const { input } = req.body || {};
  return res.json({
    input,
    output: `Test mode (${brainConfig.aiMode}): ${input || ''}`.trim(),
    memoryLogs: adminAuditLogs.filter((entry) =>
      String(entry.action || '').startsWith('conversation')
    ),
  });
});

router.get('/settings', authorizeRoles('admin', 'operator', 'viewer'), (req, res) => {
  return res.json(getMaskedSettings());
});

router.patch('/settings', authorizeRoles('admin'), (req, res) => {
  const patch = req.body || {};
  if (patch.whatsappApiConfig) {
    appSettings.whatsappApiConfig = {
      ...appSettings.whatsappApiConfig,
      ...patch.whatsappApiConfig,
    };
  }
  if (patch.featureFlags) {
    appSettings.featureFlags = { ...appSettings.featureFlags, ...patch.featureFlags };
  }
  if (typeof patch.maintenanceMode === 'boolean') {
    appSettings.maintenanceMode = patch.maintenanceMode;
  }
  if (patch.rateLimitMaxRequests) {
    appSettings.rateLimitMaxRequests = String(patch.rateLimitMaxRequests);
  }

  addAuditLog({
    actor: req.adminAuth?.sub,
    role: req.adminRole,
    action: 'settings.update',
    details: patch,
    level: 'info',
  });
  return res.json({ success: true });
});

router.post('/broadcast', authorizeRoles('admin', 'operator'), (req, res) => {
  const { segment = 'all', message, scheduleAt } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message is required' });
  addAuditLog({
    actor: req.adminAuth?.sub,
    role: req.adminRole,
    action: 'broadcast.create',
    details: { segment, message, scheduleAt },
    level: 'warn',
  });
  return res.json({ success: true, queued: true });
});

router.get('/logs', authorizeRoles('admin', 'operator', 'viewer'), (req, res) => {
  return res.json({
    items: adminAuditLogs.slice(0, 200),
  });
});

module.exports = router;
