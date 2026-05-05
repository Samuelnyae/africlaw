const client = require('prom-client');

client.collectDefaultMetrics({
  prefix: 'africlaw_',
});

const httpRequestDuration = new client.Histogram({
  name: 'africlaw_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

const brainRequestCounter = new client.Counter({
  name: 'africlaw_brain_requests_total',
  help: 'Count of calls to brain service',
  labelNames: ['status'],
});

const messageCounter = new client.Counter({
  name: 'africlaw_messages_processed_total',
  help: 'Count of WhatsApp messages processed',
  labelNames: ['result'],
});

function metricsMiddleware(req, res, next) {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode,
    });
  });
  next();
}

async function metricsHandler(req, res) {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
}

module.exports = {
  metricsMiddleware,
  metricsHandler,
  messageCounter,
  brainRequestCounter,
};
