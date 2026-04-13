const createError = require("http-errors");
const crypto = require("crypto");

const { getRazorpayWebhookSecret, isEmailConfigured } = require("../config/env");
const { getRazorpayClient, getRazorpayKeyId } = require("../config/razorpay");
const { getFileById } = require("../services/files.service");
const { sendPurchaseReceiptEmail } = require("../services/mailer.service");
const { createPaymentOrder, findPaymentOrderByOrderId, markPaymentOrderFailed, markPaymentOrderPaid } = require("../services/payment-orders.service");
const {
  createPurchase,
  findPurchaseByUserAndFile,
  getPurchaseReceiptDetails,
  getPurchasesByUser,
  reservePurchaseReceiptEmail,
  resetPurchaseReceiptEmailReservation
} = require("../services/purchases.service");
const { asyncHandler } = require("../utils/async-handler");

async function sendPurchaseReceiptIfNeeded(purchase) {
  if (!purchase?.id) {
    return;
  }

  if (!isEmailConfigured()) {
    return;
  }

  const reserved = await reservePurchaseReceiptEmail(purchase.id);

  if (!reserved) {
    return;
  }

  try {
    const receiptDetails = await getPurchaseReceiptDetails(purchase.id);

    if (!receiptDetails) {
      return;
    }

    const purchaseDate = new Date(receiptDetails.created_at).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    await sendPurchaseReceiptEmail({
      to: receiptDetails.email,
      customerName: receiptDetails.customer_name,
      purchaseDate,
      fileTitle: receiptDetails.title,
      amount: receiptDetails.price,
      paymentId: receiptDetails.payment_id,
      orderId: receiptDetails.razorpay_order_id
    });
  } catch (error) {
    await resetPurchaseReceiptEmailReservation(purchase.id);

    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to send purchase receipt email:", error);
    }
  }
}

exports.createOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email;  // ← ADD THIS LINE
  const fileId = Number(req.body.fileId);

  if (Number.isNaN(fileId) || fileId <= 0) {
    throw createError(400, "A valid fileId is required.");
  }

  // ← ADD THESE 3 LINES
  if (!userEmail) {
    throw createError(400, "A valid field is required.");
  }

  const file = await getFileById(fileId);

  if (!file) {
    throw createError(404, "File not found.");
  }

  const existingPurchase = await findPurchaseByUserAndFile(userId, fileId);

  if (existingPurchase) {
    throw createError(409, "You already own this file.");
  }

  const razorpay = getRazorpayClient();
  const receipt = `file-${file.id}-user-${userId}-${Date.now()}`;
  const amount = Math.round(Number(file.price) * 100);
  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt,
    notes: {
      fileId: String(file.id),
      userId: String(userId)
    }
  });

  await createPaymentOrder({
    orderId: order.id,
    userId,
    fileId,
    amount,
    receipt,
    status: "created"
  });

  res.status(200).json({
    success: true,
    data: {
      keyId: getRazorpayKeyId(),
      order,
      file: {
        id: file.id,
        title: file.title,
        price: file.price
      }
    }
  });
});

exports.verifyPayment = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const fileId = Number(req.body.fileId);
  const razorpayOrderId = String(req.body.razorpay_order_id || "").trim();
  const razorpayPaymentId = String(req.body.razorpay_payment_id || "").trim();
  const razorpaySignature = String(req.body.razorpay_signature || "").trim();

  if (!fileId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw createError(400, "fileId, razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.");
  }

  const file = await getFileById(fileId);

  if (!file) {
    throw createError(404, "File not found.");
  }

  const existingPurchase = await findPurchaseByUserAndFile(userId, fileId);

  if (existingPurchase) {
    return res.status(200).json({
      success: true,
      message: "Purchase already verified.",
      data: {
        purchase: existingPurchase
      }
    });
  }

  const paymentOrder = await findPaymentOrderByOrderId(razorpayOrderId);

  if (!paymentOrder || Number(paymentOrder.user_id) !== Number(userId) || Number(paymentOrder.file_id) !== Number(fileId)) {
    throw createError(400, "This payment order does not belong to the current user or file.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    throw createError(400, "Payment signature verification failed.");
  }

  const razorpay = getRazorpayClient();
  const payment = await razorpay.payments.fetch(razorpayPaymentId);

  if (!payment || payment.order_id !== razorpayOrderId || payment.status !== "captured") {
    throw createError(400, "Payment is not captured for this order.");
  }

  await markPaymentOrderPaid({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
    status: "paid"
  });

  const purchase = await createPurchase({
    userId,
    fileId,
    paymentId: razorpayPaymentId,
    razorpayOrderId: razorpayOrderId
  });

  await sendPurchaseReceiptIfNeeded(purchase);

  res.status(200).json({
    success: true,
    message: "Payment verified successfully.",
    data: {
      purchase
    }
  });
});

exports.handleWebhook = asyncHandler(async (req, res) => {
  const webhookSecret = getRazorpayWebhookSecret();

  if (!webhookSecret) {
    throw createError(500, "Razorpay webhook secret is not configured.");
  }

  const signature = req.headers["x-razorpay-signature"];
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
  const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");

  if (!signature || expectedSignature !== signature) {
    throw createError(401, "Invalid webhook signature.");
  }

  const event = JSON.parse(rawBody.toString("utf8"));
  const entity = event?.payload?.payment?.entity;
  const orderId = entity?.order_id;
  const paymentId = entity?.id;

  if (!orderId) {
    return res.status(200).json({ success: true, message: "Webhook ignored." });
  }

  if (event.event === "payment.captured") {
    const paymentOrder = await findPaymentOrderByOrderId(orderId);

    if (paymentOrder) {
      await markPaymentOrderPaid({
        orderId,
        paymentId,
        signature: null,
        status: "paid",
        webhookPayload: event
      });

      const existingPurchase = await findPurchaseByUserAndFile(paymentOrder.user_id, paymentOrder.file_id);

      if (!existingPurchase) {
        const createdPurchase = await createPurchase({
          userId: paymentOrder.user_id,
          fileId: paymentOrder.file_id,
          paymentId,
          razorpayOrderId: orderId
        });

        await sendPurchaseReceiptIfNeeded(createdPurchase);
      }
    }
  }

  if (event.event === "payment.failed") {
    await markPaymentOrderFailed({
      orderId,
      webhookPayload: event
    });
  }

  res.status(200).json({
    success: true,
    message: "Webhook processed."
  });
});

exports.getMyPurchases = asyncHandler(async (req, res) => {
  const purchases = await getPurchasesByUser(req.user.id);

  res.status(200).json({
    success: true,
    data: purchases
  });
});
