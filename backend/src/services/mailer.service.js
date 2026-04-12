const { sendMail: resendSendMail } = require("./resend.service");

async function sendMail({ to, subject, text, html }) {
  console.log("[mailer] Sending email — to:", to, "| subject:", subject);
  try {
    const result = await resendSendMail({ to, subject, text, html });
    return result;
  } catch (err) {
    console.error("[mailer] ❌ Send failed:", err.message);
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