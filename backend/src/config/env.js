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

function getSmtpForceIpv4() {
  const explicit = process.env.SMTP_FORCE_IPV4;

  if (explicit === undefined) {
    return process.env.NODE_ENV === "production";
  }

  return String(explicit).toLowerCase() === "true";
}

function getMailFrom() {
  return process.env.MAIL_FROM || getSmtpUser() || "NoteVault <no-reply@notevault.local>";
}

function isEmailConfigured() {
  // The mailer delegates to Resend (resend.service.js), not nodemailer/SMTP.
  // Check for RESEND_API_KEY — the SMTP vars are unused and should not gate emails.
  return Boolean(process.env.RESEND_API_KEY);
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
  getSmtpForceIpv4,
  getMailFrom,
  isEmailConfigured
};
