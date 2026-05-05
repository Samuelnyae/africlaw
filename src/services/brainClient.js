const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const CircuitBreaker = require('opossum');
const jwt = require('jsonwebtoken');
const { brainRequestCounter } = require('../observability/metrics');

const brainApi = axios.create({
  baseURL: process.env.BRAIN_SERVICE_URL || 'http://brain-service:4000',
  timeout: parseInt(process.env.BRAIN_TIMEOUT_MS || '5000', 10),
});

axiosRetry(brainApi, {
  retries: parseInt(process.env.BRAIN_RETRY_COUNT || '2', 10),
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    error.code === 'ECONNABORTED',
});

function createInternalToken() {
  const secret = process.env.INTERNAL_JWT_SECRET || 'dev-internal-secret';
  return jwt.sign({ service: 'bot-api' }, secret, { expiresIn: '2m' });
}

async function sendToBrain(payload) {
  const token = createInternalToken();
  const response = await brainApi.post('/process-message', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

const breaker = new CircuitBreaker(sendToBrain, {
  timeout: parseInt(process.env.BRAIN_TIMEOUT_MS || '5000', 10),
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
});

breaker.fallback(() => ({
  response: 'Samahani, huduma yetu ina shida ya muda. Tafadhali jaribu tena baadaye.',
}));

async function processBrainMessage(payload) {
  try {
    const result = await breaker.fire(payload);
    brainRequestCounter.inc({ status: 'success' });
    return result;
  } catch (error) {
    brainRequestCounter.inc({ status: 'failed' });
    throw error;
  }
}

module.exports = {
  processBrainMessage,
};
