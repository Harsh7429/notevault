function getJwtSecret() {
  return process.env.JWT_SECRET || "development-secret";
}

function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || "7d";
}

function getRazorpayWebhookSecret() {
  return process.env.RAZORPAY_WEBHOOK_SECRET || "";
}

module.exports = {
  getJwtSecret,
  getJwtExpiresIn,
  getRazorpayWebhookSecret
};
