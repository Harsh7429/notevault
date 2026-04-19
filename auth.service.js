const { query } = require("../config/db");

async function findPurchaseByUserAndFile(userId, fileId) {
  const result = await query(
    `SELECT id, user_id, file_id, payment_id, razorpay_order_id, created_at
     FROM purchases
     WHERE user_id = $1 AND file_id = $2`,
    [userId, fileId]
  );

  return result.rows[0] || null;
}

async function createPurchase({ userId, fileId, paymentId, razorpayOrderId = null }) {
  const result = await query(
    `INSERT INTO purchases (user_id, file_id, payment_id, razorpay_order_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, file_id)
     DO UPDATE SET payment_id = EXCLUDED.payment_id,
                   razorpay_order_id = COALESCE(EXCLUDED.razorpay_order_id, purchases.razorpay_order_id)
     RETURNING id, user_id, file_id, payment_id, razorpay_order_id, receipt_emailed_at, created_at`,
    [userId, fileId, paymentId, razorpayOrderId]
  );

  return result.rows[0];
}

async function getPurchasesByUser(userId) {
  const result = await query(
    `SELECT
       purchases.id,
       purchases.payment_id,
       purchases.razorpay_order_id,
       purchases.receipt_emailed_at,
       purchases.created_at,
       files.id AS file_id,
       files.title,
       files.description,
       files.subject,
       files.course,
       files.semester,
       files.unit_label,
       files.page_count,
       files.is_featured,
       files.price,
       files.thumbnail
     FROM purchases
     INNER JOIN files ON files.id = purchases.file_id
     WHERE purchases.user_id = $1
     ORDER BY purchases.created_at DESC`,
    [userId]
  );

  return result.rows;
}

async function reservePurchaseReceiptEmail(purchaseId) {
  const result = await query(
    `UPDATE purchases
     SET receipt_emailed_at = NOW()
     WHERE id = $1
       AND receipt_emailed_at IS NULL
     RETURNING id`,
    [purchaseId]
  );

  return Boolean(result.rows[0]);
}

async function resetPurchaseReceiptEmailReservation(purchaseId) {
  await query(
    `UPDATE purchases
     SET receipt_emailed_at = NULL
     WHERE id = $1`,
    [purchaseId]
  );
}

async function getPurchaseReceiptDetails(purchaseId) {
  const result = await query(
    `SELECT
       purchases.id,
       purchases.payment_id,
       purchases.razorpay_order_id,
       purchases.created_at,
       users.name AS customer_name,
       users.email,
       files.title,
       files.price
     FROM purchases
     INNER JOIN users ON users.id = purchases.user_id
     INNER JOIN files ON files.id = purchases.file_id
     WHERE purchases.id = $1`,
    [purchaseId]
  );

  return result.rows[0] || null;
}

async function getSalesAnalytics() {
  const summaryResult = await query(
    `SELECT
       COUNT(*)::int AS total_purchases,
       COALESCE(SUM(files.price), 0)::numeric(10,2) AS total_revenue,
       COUNT(DISTINCT purchases.user_id)::int AS unique_buyers
     FROM purchases
     INNER JOIN files ON files.id = purchases.file_id`
  );

  const topProductsResult = await query(
    `SELECT
       files.id,
       files.title,
       files.subject,
       files.price,
       COUNT(purchases.id)::int AS purchase_count,
       COALESCE(SUM(files.price), 0)::numeric(10,2) AS revenue
     FROM files
     LEFT JOIN purchases ON purchases.file_id = files.id
     GROUP BY files.id
     ORDER BY purchase_count DESC, files.created_at DESC
     LIMIT 5`
  );

  const recentPurchasesResult = await query(
    `SELECT
       purchases.id,
       purchases.created_at,
       users.email,
       files.title,
       files.price
     FROM purchases
     INNER JOIN users ON users.id = purchases.user_id
     INNER JOIN files ON files.id = purchases.file_id
     ORDER BY purchases.created_at DESC
     LIMIT 5`
  );

  return {
    ...(summaryResult.rows[0] || {
      total_purchases: 0,
      total_revenue: 0,
      unique_buyers: 0
    }),
    topProducts: topProductsResult.rows,
    recentPurchases: recentPurchasesResult.rows
  };
}

module.exports = {
  findPurchaseByUserAndFile,
  createPurchase,
  getPurchasesByUser,
  reservePurchaseReceiptEmail,
  resetPurchaseReceiptEmailReservation,
  getPurchaseReceiptDetails,
  getSalesAnalytics
};
