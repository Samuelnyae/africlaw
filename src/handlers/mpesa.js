const axios = require('axios');
const moment = require('moment');
const { db } = require('../config/firebase');
const { sendWhatsAppMessage } = require('./whatsapp');

/**
 * Generate M-Pesa access token from Daraja API
 * @returns {Promise<string>} Access token
 */
async function getMPesaAccessToken() {
  try {
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const response = await axios.post(
      `${process.env.MPESA_API_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {},
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    console.log('[AfriClaw] M-Pesa access token generated');
    return response.data.access_token;
  } catch (error) {
    console.error(
      `[AfriClaw] Error getting M-Pesa access token: ${error.message}`
    );
    throw error;
  }
}

/**
 * Initiate M-Pesa STK Push (payment prompt)
 * @param {string} phoneNumber - Customer phone number (254712345678)
 * @param {number} amount - Amount in KES
 * @param {string} accountReference - Transaction reference
 * @returns {Promise<Object>} STK Push response
 */
async function initiateSTKPush(phoneNumber, amount, accountReference) {
  try {
    const accessToken = await getMPesaAccessToken();
    const timestamp = moment().format('YYYYMMDDHHmmss');

    // Build STK Push request password
    const stkPassword = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const response = await axios.post(
      `${process.env.MPESA_API_URL}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: stkPassword,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: phoneNumber,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phoneNumber,
        CallBackURL: `${process.env.WEBHOOK_URL}/mpesa/callback`,
        AccountReference: accountReference,
        TransactionDesc: 'Payment via AfriClaw',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log(`[AfriClaw] STK Push initiated for ${phoneNumber}`);
    return response.data;
  } catch (error) {
    console.error(
      `[AfriClaw] Error initiating STK Push: ${error.message}`
    );
    throw error;
  }
}

/**
 * Check M-Pesa account balance
 * @returns {Promise<number>} Account balance
 */
async function checkBalance() {
  try {
    const accessToken = await getMPesaAccessToken();
    const timestamp = moment().format('YYYYMMDDHHmmss');

    const stkPassword = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const response = await axios.post(
      `${process.env.MPESA_API_URL}/mpesa/accountbalance/v1/query`,
      {
        Initiator: 'testapi',
        SecurityCredential: Buffer.from('Safaricom124!').toString('base64'),
        CommandID: 'GetBalance',
        PartyA: process.env.MPESA_SHORTCODE,
        IdentifierType: '4',
        Remarks: 'Balance Check',
        QueueTimeOutURL: `${process.env.WEBHOOK_URL}/mpesa/timeout`,
        ResultURL: `${process.env.WEBHOOK_URL}/mpesa/result`,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log('[AfriClaw] M-Pesa balance check initiated');
    return response.data;
  } catch (error) {
    console.error(
      `[AfriClaw] Error checking M-Pesa balance: ${error.message}`
    );
    throw error;
  }
}

/**
 * Store M-Pesa transaction record
 * @param {string} phoneNumber - Customer phone number
 * @param {Object} transactionData - Transaction details
 */
async function storeTransaction(phoneNumber, transactionData) {
  const transactionRef = db
    .collection('mpesa_transactions')
    .doc(transactionData.CheckoutRequestID);

  const transaction = {
    ...transactionData,
    phoneNumber,
    createdAt: moment().toISOString(),
    status: 'pending',
  };

  await transactionRef.set(transaction);
  console.log(
    `[AfriClaw] M-Pesa transaction stored: ${transactionData.CheckoutRequestID}`
  );
}

/**
 * Handle M-Pesa callback (STK Push result)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function handleMPesaCallback(req, res) {
  try {
    const callbackData = req.body.Body.stkCallback;
    console.log('[AfriClaw] M-Pesa callback received');

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
      callbackData;

    // Extract phone number from metadata
    const phoneNumber = CallbackMetadata?.Item?.find(
      (item) => item.Name === 'PhoneNumber'
    )?.Value;

    if (!phoneNumber) {
      console.error('[AfriClaw] Phone number not found in callback');
      return res.status(200).json({ success: false });
    }

    // Update transaction status
    await db
      .collection('mpesa_transactions')
      .doc(CheckoutRequestID)
      .update({
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        status: ResultCode === 0 ? 'success' : 'failed',
        updatedAt: moment().toISOString(),
      });

    // Send confirmation to user
    if (ResultCode === 0) {
      await sendWhatsAppMessage(
        phoneNumber,
        'Umefanikisha kulipa! Asante sana. (Payment successful! Thank you.)'
      );
      console.log(`[AfriClaw] Payment successful for ${phoneNumber}`);
    } else {
      await sendWhatsAppMessage(
        phoneNumber,
        `Malipo hayakufanikisha. Sababu: ${ResultDesc} (Payment failed. Reason: ${ResultDesc})`
      );
      console.log(`[AfriClaw] Payment failed for ${phoneNumber}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`[AfriClaw] M-Pesa callback error: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getMPesaAccessToken,
  initiateSTKPush,
  checkBalance,
  storeTransaction,
  handleMPesaCallback,
};
