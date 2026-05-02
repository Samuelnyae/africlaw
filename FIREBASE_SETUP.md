# Firebase Service Account Setup for AfriClaw

Your Firebase web config is ready:
- **Project ID:** africlaw-b8ecd
- **Auth Domain:** africlaw-b8ecd.firebaseapp.com
- **API Key:** AIzaSyDql_w6r7Ny5-BmUCo8EPq5GhTV2uZohs0

But for the backend, you need the **Service Account JSON**. Here's how to get it:

## Step 1: Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com)
2. Select your project: **africlaw-b8ecd**

## Step 2: Get Service Account
1. Click the gear icon (⚙️) → **Project Settings**
2. Click the **Service Accounts** tab
3. Select **Node.js** in the SDK dropdown
4. Click **Generate New Private Key**
5. A JSON file will download

## Step 3: Extract Values
Open the downloaded JSON and copy these values into your `.env` file:

```json
{
  "type": "service_account",
  "project_id": "africlaw-b8ecd",
  "private_key_id": "COPY_THIS_VALUE",
  "private_key": "COPY_THIS_VALUE",
  "client_email": "COPY_THIS_VALUE",
  "client_id": "COPY_THIS_VALUE",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "COPY_THIS_VALUE"
}
```

## Step 4: Update .env File
Replace these values in `.env`:
- `FIREBASE_PRIVATE_KEY_ID` = private_key_id from JSON
- `FIREBASE_PRIVATE_KEY` = private_key from JSON (keep the \n characters!)
- `FIREBASE_CLIENT_EMAIL` = client_email from JSON
- `FIREBASE_CLIENT_ID` = client_id from JSON
- `FIREBASE_CLIENT_X509_CERT_URL` = client_x509_cert_url from JSON

## Step 5: Create Firestore Collections
1. In Firebase Console, go to **Firestore Database**
2. Click **Create Collection**
3. Create these collections:
   - `users` (with document ID: auto-generated)
   - `conversations` (with document ID: auto-generated)

## Step 6: Set up Firestore Rules (Optional)
For security in production, update your Firestore rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /conversations/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 7: Restart Server
After updating `.env`, restart the server:
```bash
npm run dev
```

Your Firestore connection will be ready!

## Troubleshooting
- **"Cannot find module 'firebase-admin'"** → Run `npm install`
- **"FIREBASE_PROJECT_ID is not set"** → Check your `.env` file
- **"Permission denied"** → Ensure Firestore rules allow your requests
