const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for general API routes
 * Limits requests based on IP address
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    console.warn(`[AfriClaw] Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests. Please try again later.',
    });
  },
});

/**
 * Rate limiter for WhatsApp webhook
 * More lenient since Twilio needs to retry
 */
const whatsappLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many webhook requests',
  skip: (req) => {
    // Don't count Twilio retries
    return req.get('X-Twilio-Signature');
  },
});

/**
 * Rate limiter for M-Pesa callback
 * Very lenient - critical webhook
 */
const mPesaLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // Very high limit
  message: 'Too many M-Pesa webhook requests',
  skip: (req) => {
    // Skip rate limiting for M-Pesa callbacks
    return req.path.includes('/mpesa');
  },
});

/**
 * Rate limiter for admin dashboard
 * Protects against brute force attacks
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit to 50 requests per 15 minutes
  message: 'Too many admin requests. Please try again later.',
  handler: (req, res) => {
    console.warn(`[AfriClaw] Admin rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests. Please try again later.',
    });
  },
});

module.exports = {
  apiLimiter,
  whatsappLimiter,
  mPesaLimiter,
  adminLimiter,
};
