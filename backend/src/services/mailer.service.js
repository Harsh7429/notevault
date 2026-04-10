const nodemailer = require("nodemailer");

const {
  getMailFrom,
  getSmtpHost,
  getSmtpPass,
  getSmtpPort,
  getSmtpSecure,
  getSmtpUser,
  isEmailConfigured
} = require("../config/env");

let transporter;

function getTransporter() {
  if (!isEmailConfigured()) {
    throw new Error("SMTP email delivery is not configured.");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: getSmtpHost(),
      port: getSmtpPort(),
      secure: getSmtpSecure(),
      auth: {
        user: getSmtpUser(),
        pass: getSmtpPass()
      }
    });
  }

  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const activeTransporter = getTransporter();

  return activeTransporter.sendMail({
    from: getMailFrom(),
    to,
    subject,
    text,
    html
  });
}

async function sendLoginOtpEmail({ to, name, otpCode, expiresInMinutes, deviceId }) {
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
  sendLoginOtpEmail,
  sendPurchaseReceiptEmail
};
