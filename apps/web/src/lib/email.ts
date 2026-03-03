import { Resend } from "resend";

const apiKey = process.env["RESEND_API_KEY"];
const fromEmail = process.env["RESEND_FROM_EMAIL"] ?? "Socialbud <onboarding@resend.dev>";

/**
 * Send a one-off email via Resend. Returns { sent: true } or { sent: false, error }.
 * If RESEND_API_KEY is not set, returns { sent: false, error: "..." } without throwing.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ sent: boolean; error?: string }> {
  if (!apiKey) {
    return { sent: false, error: "RESEND_API_KEY is not set" };
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    if (error) return { sent: false, error: error.message };
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return { sent: false, error: message };
  }
}

/**
 * Notify a user that their Socialbud account has been deleted (admin action).
 */
export async function sendAccountDeletedEmail(to: string): Promise<{
  sent: boolean;
  error?: string;
}> {
  const subject = "Your Socialbud account has been deleted";
  const html = `
    <p>Hello,</p>
    <p>Your Socialbud account has been permanently deleted by an administrator.</p>
    <p>If you believe this was done in error, please contact support.</p>
    <p>— The Socialbud team</p>
  `;
  const text = [
    "Hello,",
    "Your Socialbud account has been permanently deleted by an administrator.",
    "If you believe this was done in error, please contact support.",
    "— The Socialbud team",
  ].join("\n");
  return sendEmail({ to, subject, html, text });
}
