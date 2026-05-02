const Anthropic = require('@anthropic-ai/sdk');

let client = null;

if (process.env.ANTHROPIC_API_KEY) {
  client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  console.log('[AfriClaw] Anthropic client initialized');
} else {
  console.log('[AfriClaw] Anthropic API key not found - running in mock mode');
}

/**
 * System prompt for Claude - tailored for Kenyan/African context
 */
const SYSTEM_PROMPT = `You are AfriClaw, an AI assistant designed to help people in Africa, particularly Kenya. You are helpful, friendly, and knowledgeable about African issues, Kenyan culture, and local solutions.

You should:
- Respond primarily in the language the user is using (English or Swahili)
- Be respectful and culturally sensitive
- Provide practical advice relevant to Kenya and Africa
- Keep responses concise (under 200 words)
- Use simple, clear language
- Be helpful with local financial questions, business advice, health information, and more
- When users want to make payments, help them understand M-Pesa integration

Important: Do not pretend to be a human. Be transparent that you are an AI. Keep conversations natural and helpful.`;

/**
 * Detect if message is in Swahili
 * @param {string} text - Text to check
 * @returns {boolean} True if text appears to be Swahili
 */
function detectSwahili(text) {
  // Simple heuristic - check for common Swahili words
  const swahiliWords = [
    'habari',
    'asante',
    'tafadhali',
    'ndiyo',
    'hapana',
    'jambo',
    'mwenyeji',
    'karibu',
    'sana',
    'kwa',
    'rafiki',
    'nyumbani',
  ];
  const lowerText = text.toLowerCase();
  return swahiliWords.some((word) => lowerText.includes(word));
}

/**
 * Call Claude API with conversation history
 * @param {string} userMessage - Current user message
 * @param {Array} conversationHistory - Previous messages for context
 * @param {string} phoneNumber - User's phone number (for logging)
 * @returns {Promise<string>} Claude's response
 */
async function getClaudeResponse(userMessage, conversationHistory, phoneNumber) {
  try {
    console.log(`[AfriClaw] Calling Claude for user: ${phoneNumber}`);

    // Detect language
    const isSwahili = detectSwahili(userMessage);

    // In mock mode, return demo response
    if (!client) {
      console.log(`[AfriClaw] MOCK MODE: Generating demo response for ${phoneNumber}`);
      if (isSwahili) {
        return 'Habari! Mimi ni AfriClaw, msaada wa AI kwa Waafrika. Jinsi gani naweza kukusaidia leo?';
      }
      return 'Hello! I am AfriClaw, an AI assistant for Africa. How can I help you today?';
    }

    // Build messages array with conversation history
    const messages = [
      ...conversationHistory.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Call Claude API
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const assistantMessage = response.content[0].text;
    console.log(
      `[AfriClaw] Claude response generated for ${phoneNumber} (${isSwahili ? 'Swahili' : 'English'})`
    );

    return assistantMessage;
  } catch (error) {
    console.error(
      `[AfriClaw] Claude API error for ${phoneNumber}: ${error.message}`
    );

    // Fallback response
    if (detectSwahili(userMessage)) {
      return 'Karibu, ninataka kusaidiana lakini kuna tatizo la muda. Tafadhali jaribu tena baadaye.';
    }
    return 'Sorry, I encountered an error. Please try again later.';
  }
}

/**
 * Check if message requires M-Pesa integration
 * @param {string} text - User message text
 * @returns {boolean} True if payment-related
 */
function isMPesaRequest(text) {
  const paymentKeywords = [
    'pay',
    'lipa',
    'pesa',
    'send',
    'transfer',
    'mpesa',
    'money',
    'pesa tungu',
  ];
  const lowerText = text.toLowerCase();
  return paymentKeywords.some((keyword) => lowerText.includes(keyword));
}

module.exports = {
  getClaudeResponse,
  detectSwahili,
  isMPesaRequest,
};
