const dns = require("dns").promises;
const net = require("net");
const nodemailer = require("nodemailer");

const {
  getSmtpForceIpv4,
  getMailFrom,
  getSmtpHost,
  getSmtpPass,
  getSmtpPort,
  getSmtpSecure,
  getSmtpUser,
  isEmailConfigured
} = require("../config/env");

let transporter;
let transporterPromise;

async function getTransportOptions() {
  const host = getSmtpHost();
  const baseOptions = {
    host,
    port: getSmtpPort(),
    secure: getSmtpSecure(),
    auth: {
      user: getSmtpUser(),
      pass: getSmtpPass()
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    dnsTimeout: 15000
  };

  if (!getSmtpForceIpv4() || net.isIP(host)) {
    return baseOptions;
  }

  try {
    const ipv4Addresses = await dns.resolve4(host);

    if (ipv4Addresses.length > 0) {
      return {
        ...baseOptions,
        host: ipv4Addresses[0],
        tls: {
          servername: host
        }
      };
    }
  } catch (_error) {
    // Fall back to the configured hostname if IPv4 resolution is unavailable.
  }

  return baseOptions;
}

async function getTransporter() {
  if (!isEmailConfigured()) {
    console.error("[mailer] ❌ SMTP not configured — SMTP_USER or SMTP_PASS is empty");
    throw new Error("SMTP email delivery is not configured.");
  }

  if (!transporter) {
    console.log("[mailer] Creating SMTP transporter —", {
      host: getSmtpHost(),
      port: getSmtpPort(),
      secure: getSmtpSecure(),
      user: getSmtpUser(),
      passLength: getSmtpPass()?.length ?? 0,
      forceIPv4: getSmtpForceIpv4()
    });

    if (!transporterPromise) {
      transporterPromise = getTransportOptions().then((options) => nodemailer.createTransport(options));
    }

    transporter = await transporterPromise;
    console.log("[mailer] ✅ Transporter created successfully");
  }

  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  console.log("[mailer] Sending email — to:", to, "| subject:", subject);

  try {
    const activeTransporter = await getTransporter();
    const info = await activeTransporter.sendMail({
      from: getMailFrom(),
      to,
      subject,
      text,
      html
    });

    console.log("[mailer] ✅ Email sent — messageId:", info.messageId, "| accepted:", info.accepted, "| rejected:", info.rejected);
    return info;
  } catch (err) {
    console.error("[mailer] ❌ Failed to send email to:", to);
    console.error("[mailer] Error code:", err.code, "| responseCode:", err.responseCode, "| command:", err.command);
    console.error("[mailer] Message:", err.message);
    throw err;
  }
}

async function sendLoginOtpEmail({ to, name, otpCode, expiresInMinutes, deviceId }) {
  console.log("[mailer] Preparing login OTP email for:", to);
  const greeting = name ? `Hi ${name},` : "Hi,";

  return sendMail({
    to,
    subject: "Your NoteVault login OTP",
    text: `${greeting}

Your NoteVault login code is ${otpCode}.

This code expires in ${expiresInMinutes} minutes and is valid only for the current login attempt on device ${deviceId}.

If you did not try to log in, please change your password immediately.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#171511">
        <p>${greeting}</p>
        <p>Your NoteVault login code is:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:20px 0">${otpCode}</p>
        <p>This code expires in <strong>${expiresInMinutes} minutes</strong> and is valid only for the current login attempt.</p>
        <p style="color:#6b6256">Device reference: ${deviceId}</p>
        <p>If you did not try to log in, please change your password immediately.</p>
      </div>
    `
  });
}

async function sendRegistrationOtpEmail({ to, name, otpCode, expiresInMinutes, deviceId }) {
  console.log("[mailer] Preparing registration OTP email for:", to);
  const greeting = name ? `Hi ${name},` : "Hi,";

  return sendMail({
    to,
    subject: "Verify your NoteVault registration",
    text: `${greeting}

Your NoteVault registration code is ${otpCode}.

This code expires in ${expiresInMinutes} minutes and is valid only for the current signup attempt on device ${deviceId}.

If you did not try to create a NoteVault account, you can safely ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#171511">
        <p>${greeting}</p>
        <p>Use this code to verify your new <strong>NoteVault</strong> account:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:20px 0">${otpCode}</p>
        <p>This code expires in <strong>${expiresInMinutes} minutes</strong> and is valid only for the current signup attempt.</p>
        <p style="color:#6b6256">Device reference: ${deviceId}</p>
        <p>If you did not try to create a NoteVault account, you can safely ignore this email.</p>
      </div>
    `
  });
}

async function sendPurchaseReceiptEmail({ to, customerName, purchaseDate, fileTitle, amount, paymentId, orderId }) {
  const safeAmount = Number(amount || 0).toFixed(2);
  const greeting = customerName ? `Hi ${customerName},` : "Hi,";

  return sendMail({
    to,
    subject: `Your NoteVault receipt for ${fileTitle}`,
    text: `${greeting}

Thank you for your purchase on NoteVault.

Product: ${fileTitle}
Amount paid: Rs. ${safeAmount}
Payment ID: ${paymentId}
Order ID: ${orderId}
Purchased on: ${purchaseDate}

You can now open the product from your NoteVault library.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#171511">
        <p>${greeting}</p>
        <p>Thank you for your purchase on <strong>NoteVault</strong>.</p>
        <table style="border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:6px 12px 6px 0"><strong>Product</strong></td><td>${fileTitle}</td></tr>
          <tr><td style="padding:6px 12px 6px 0"><strong>Amount paid</strong></td><td>Rs. ${safeAmount}</td></tr>
          <tr><td style="padding:6px 12px 6px 0"><strong>Payment ID</strong></td><td>${paymentId}</td></tr>
          <tr><td style="padding:6px 12px 6px 0"><strong>Order ID</strong></td><td>${orderId}</td></tr>
          <tr><td style="padding:6px 12px 6px 0"><strong>Purchased on</strong></td><td>${purchaseDate}</td></tr>
        </table>
        <p>Your viewer access is now active in your NoteVault library.</p>
      </div>
    `
  });
}

module.exports = {
  sendRegistrationOtpEmail,
  sendLoginOtpEmail,
  sendPurchaseReceiptEmail
};
