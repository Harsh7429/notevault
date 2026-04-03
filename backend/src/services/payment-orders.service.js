const { query } = require("../config/db");

async function createPaymentOrder({ orderId, userId, fileId, amount, receipt, status = "created" }) {
  const result = await query(
    `INSERT INTO payment_orders (razorpay_order_id, user_id, file_id, amount, receipt, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (razorpay_order_id)
     DO UPDATE SET amount = EXCLUDED.amount,
                   receipt = EXCLUDED.receipt,
                   status = EXCLUDED.status,
                   updated_at = NOW()
     RETURNING id, razorpay_order_id, user_id, file_id, amount, receipt, status, razorpay_payment_id, created_at, updated_at`,
    [orderId, userId, fileId, amount, receipt, status]
  );

  return result.rows[0] || null;
}

async function findPaymentOrderByOrderId(orderId) {
  const result = await query(
    `SELECT id, razorpay_order_id, user_id, file_id, amount, receipt, status, razorpay_payment_id, created_at, updated_at
     FROM payment_orders
     WHERE razorpay_order_id = $1`,
    [orderId]
  );

  return result.rows[0] || null;
}

async function markPaymentOrderPaid({ orderId, paymentId, signature, status = "paid", webhookPayload = null }) {
  const result = await query(
    `UPDATE payment_orders
     SET razorpay_payment_id = COALESCE($2, razorpay_payment_id),
         razorpay_signature = COALESCE($3, razorpay_signature),
         status = $4,
         webhook_payload = COALESCE($5, webhook_payload),
         updated_at = NOW()
     WHERE razorpay_order_id = $1
     RETURNING id, razorpay_order_id, user_id, file_id, amount, receipt, status, razorpay_payment_id, created_at, updated_at`,
    [orderId, paymentId || null, signature || null, status, webhookPayload ? JSON.stringify(webhookPayload) : null]
  );

  return result.rows[0] || null;
}

async function markPaymentOrderFailed({ orderId, webhookPayload = null }) {
  const result = await query(
    `UPDATE payment_orders
     SET status = 'failed',
         webhook_payload = COALESCE($2, webhook_payload),
         updated_at = NOW()
     WHERE razorpay_order_id = $1
     RETURNING id, razorpay_order_id, user_id, file_id, amount, receipt, status, razorpay_payment_id, created_at, updated_at`,
    [orderId, webhookPayload ? JSON.stringify(webhookPayload) : null]
  );

  return result.rows[0] || null;
}

module.exports = {
  createPaymentOrder,
  findPaymentOrderByOrderId,
  markPaymentOrderPaid,
  markPaymentOrderFailed
};
