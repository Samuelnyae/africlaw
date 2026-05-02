/**
 * Basic authentication middleware for admin routes
 * Uses HTTP Basic Auth with username: admin
 */
function basicAuth(req, res, next) {
  const authHeader = req.get('Authorization') || '';

  // Extract credentials from header
  const match = authHeader.match(/^Basic\s+(.+)$/i);

  if (!match) {
    console.log('[AfriClaw] Missing authorization header');
    res.set('WWW-Authenticate', 'Basic realm="AfriClaw Admin"');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Decode base64 credentials
    const credentials = Buffer.from(match[1], 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    // Validate credentials
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (username === 'admin' && password === adminPassword) {
      console.log('[AfriClaw] Admin authentication successful');
      return next();
    }

    console.log(
      `[AfriClaw] Failed admin authentication attempt from IP: ${req.ip}`
    );
    res.set('WWW-Authenticate', 'Basic realm="AfriClaw Admin"');
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('[AfriClaw] Auth middleware error:', error.message);
    res.set('WWW-Authenticate', 'Basic realm="AfriClaw Admin"');
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

/**
 * Middleware to log requests
 */
function requestLogger(req, res, next) {
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`
  );
  next();
}

module.exports = {
  basicAuth,
  requestLogger,
};
