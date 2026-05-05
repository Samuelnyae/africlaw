const { admin, IS_MOCK_MODE } = require('../config/firebase');

function extractToken(req) {
  const authHeader = req.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '').trim();
  }
  return '';
}

async function requireFirebaseJwt(req, res, next) {
  const token = extractToken(req);

  if (!token) return res.status(401).json({ error: 'Missing token' });
  if (IS_MOCK_MODE) {
    req.adminAuth = {
      sub: 'mock-admin',
      role: 'admin',
      iat: Math.floor(Date.now() / 1000),
    };
    return next();
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token, true);
    // If no custom role claim is set, default to 'admin' for authenticated Firebase users
    if (!decoded.role && !decoded.claims?.role) {
      decoded.role = process.env.DEFAULT_ADMIN_ROLE || 'admin';
    }
    req.adminAuth = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function enforceSessionTimeout(req, res, next) {
  const timeoutMinutes = parseInt(process.env.ADMIN_SESSION_TIMEOUT_MIN || '60', 10);
  const issuedAt = req.adminAuth?.iat;
  if (!issuedAt) return res.status(401).json({ error: 'Invalid auth payload' });

  const now = Math.floor(Date.now() / 1000);
  if (now - issuedAt > timeoutMinutes * 60) {
    return res.status(401).json({ error: 'Session expired' });
  }
  return next();
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const role =
      req.adminAuth?.role ||
      req.adminAuth?.claims?.role ||
      req.adminAuth?.firebase?.sign_in_provider_role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Insufficient role permissions' });
    }
    req.adminRole = role;
    return next();
  };
}

module.exports = {
  requireFirebaseJwt,
  authorizeRoles,
  enforceSessionTimeout,
};
