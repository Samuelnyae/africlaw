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

  // Railway sets x-forwarded-proto header for HTTPS
  const proto = req.headers['x-forwarded-proto'];
  const isSecure = req.secure || proto === 'https';
  
  // Allow health checks over HTTP
  if (req.path === '/health') {
    return next();
  }
  
  if (isSecure) {
    return next();
  }

  return res.redirect(`https://${req.headers.host}${req.url}`);
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
