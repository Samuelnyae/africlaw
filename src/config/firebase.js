const admin = require('firebase-admin');

// Check if we're in mock mode (development without real Firebase credentials)
const IS_MOCK_MODE = !process.env.FIREBASE_PROJECT_ID;

if (IS_MOCK_MODE) {
  console.log('[AfriClaw] ⚠️  MOCK MODE: Running without Firebase credentials');
  console.log('[AfriClaw] This is for development/testing only.');
  console.log('[AfriClaw] Set FIREBASE_PROJECT_ID to use real Firebase.');
}

let admin_module = admin;
let db = null;

if (!IS_MOCK_MODE) {
  // Parse Firebase credentials from environment variables
  const firebaseConfig = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  };

  // Initialize Firebase Admin SDK
  try {
    admin_module.initializeApp({
      credential: admin_module.credential.cert(firebaseConfig),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
    console.log('[AfriClaw] Firebase initialized successfully');
    db = admin_module.firestore();
  } catch (error) {
    console.error('[AfriClaw] Firebase initialization error:', error.message);
    console.error('[AfriClaw] Check your FIREBASE_PROJECT_ID environment variable');
    process.exit(1);
  }
} else {
  // Mock Firestore for development
  db = {
    collection: () => ({
      doc: () => ({
        get: async () => ({ exists: false, data: () => ({}) }),
        set: async () => ({ success: true }),
        update: async () => ({ success: true }),
      }),
      where: () => ({
        get: async () => ({ docs: [] }),
      }),
      add: async () => ({ id: 'mock-id' }),
      get: async () => ({ docs: [] }),
    }),
  };
}

module.exports = {
  admin: admin_module,
  db,
  IS_MOCK_MODE,
};
