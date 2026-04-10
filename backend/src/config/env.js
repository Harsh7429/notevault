function requireEnv(name, fallback = "") {
  const value = process.env[name];

  if (value) {
    return value;
  }

  if (process.env.NODE_ENV === "production" && !fallback) {
    throw new Error(`${name} is required in production.`);
  }

  return fallback;
}

function getJwtSecret() {
  return requireEnv("JWT_SECRET", "development-secret");
}

function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || "7d";
}

function getRazorpayWebhookSecret() {
  return process.env.RAZORPAY_WEBHOOK_SECRET || "";
}

function getOtpExpiryMinutes() {
  const value = Number(process.env.LOGIN_OTP_EXPIRES_MINUTES || 10);
  return Number.isFinite(value) && value > 0 ? value : 10;
}

function getOtpMaxAttempts() {
  const value = Number(process.env.LOGIN_OTP_MAX_ATTEMPTS || 5);
  return Number.isFinite(value) && value > 0 ? value : 5;
}

function getSmtpHost() {
  return process.env.SMTP_HOST || "smtp.gmail.com";
}

function getSmtpPort() {
  const value = Number(process.env.SMTP_PORT || 465);
  return Number.isFinite(value) && value > 0 ? value : 465;
}

function getSmtpSecure() {
  const explicit = process.env.SMTP_SECURE;

  if (explicit === undefined) {
    return getSmtpPort() === 465;
  }

  return String(explicit).toLowerCase() === "true";
}

function getSmtpUser() {
  return process.env.SMTP_USER || "";
}

function getSmtpPass() {
  return process.env.SMTP_PASS || "";
}

function getMailFrom() {
  return process.env.MAIL_FROM || getSmtpUser() || "NoteVault <no-reply@notevault.local>";
}

function isEmailConfigured() {
  return Boolean(getSmtpUser() && getSmtpPass());
}

module.exports = {
  getJwtSecret,
  getJwtExpiresIn,
  getRazorpayWebhookSecret,
  getOtpExpiryMinutes,
  getOtpMaxAttempts,
  getSmtpHost,
  getSmtpPort,
  getSmtpSecure,
  getSmtpUser,
  getSmtpPass,
  getMailFrom,
  isEmailConfigured
};
