const midtransClient = require('midtrans-client');
const crypto = require('crypto');

const isProduction = (process.env.MIDTRANS_IS_PRODUCTION === 'true');
const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
const clientKey = process.env.MIDTRANS_CLIENT_KEY || '';

const snap = new midtransClient.Snap({ isProduction, serverKey, clientKey });

function generateOrderId(itemId, userId) {
  return `order_${itemId}_${userId}_${Date.now()}`;
}

async function createTransaction(orderId, amount, customer) {
  const parameter = {
    transaction_details: { order_id: orderId, gross_amount: amount },
    credit_card: { secure: true },
    customer_details: customer
  };
  // returns object {redirect_url, token} depending on snap response
  return snap.createTransaction(parameter);
}

function verifyNotification(body) {
  // signature_key = sha512(order_id + status_code + gross_amount + serverKey)
  try {
    const { order_id = '', status_code = '', gross_amount = '', signature_key = '' } = body;
    const expected = crypto.createHash('sha512').update(order_id + status_code + gross_amount + serverKey).digest('hex');
    return expected === String(signature_key);
  } catch (e) {
    return false;
  }
}

module.exports = { snap, createTransaction, generateOrderId, verifyNotification };
