const helmet = require('helmet');
const jwt = require('jsonwebtoken');

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://cdn.tailwindcss.com",
        "https://cdn.jsdelivr.net",
        "https://www.gstatic.com",
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      connectSrc: ["'self'", "https://*.googleapis.com", "https://*.firebaseapp.com", "https://*.firebaseio.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

function requireHttps(req, res, next) {
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const proto = req.headers['x-forwarded-proto'];
  if (req.secure || proto === 'https') {
    return next();
  }

  return res.status(400).json({ error: 'HTTPS required' });
}

function internalServiceAuth(req, res, next) {
  const authHeader = req.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  const secret = process.env.INTERNAL_JWT_SECRET;

  if (!secret) {
    return res.status(500).json({ error: 'Internal auth not configured' });
  }

  if (!token) {
    return res.status(401).json({ error: 'Missing internal token' });
  }

  try {
    const payload = jwt.verify(token, secret);
    req.internalService = payload.service;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid internal token' });
  }
}

module.exports = {
  securityHeaders,
  requireHttps,
  internalServiceAuth,
};
