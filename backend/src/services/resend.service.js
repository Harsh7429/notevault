const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail({ to, subject, text, html }) {
  console.log("[resend] Sending email — to:", to, "| subject:", subject);

  const { data, error } = await resend.emails.send({
    from: process.env.MAIL_FROM || "NoteVault <onboarding@resend.dev>",
    to,
    subject,
    text,
    html
  });

  if (error) {
    console.error("[resend] ❌ Failed to send email to:", to);
    console.error("[resend] Error:", error.message || error);
    throw new Error(error.message || "Resend email delivery failed");
  }

  console.log("[resend] ✅ Email sent successfully — id:", data.id);
  return data;
}

module.exports = { sendMail };