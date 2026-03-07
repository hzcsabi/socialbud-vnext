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
 * Send a workspace invitation email. acceptLink should be the full URL to accept (e.g. /invite/accept?token=X).
 */
export async function sendInvitationEmail(params: {
  to: string;
  inviterDisplayName: string;
  accountName: string;
  acceptLink: string;
}): Promise<{ sent: boolean; error?: string }> {
  const { to, inviterDisplayName, accountName, acceptLink } = params;
  const subject = `You're invited to join ${accountName} on Socialbud`;
  const html = `
    <p>Hello,</p>
    <p><strong>${escapeHtml(inviterDisplayName || "A teammate")}</strong> has invited you to join the workspace <strong>${escapeHtml(accountName)}</strong> on Socialbud.</p>
    <p><a href="${escapeHtml(acceptLink)}" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">Accept invitation</a></p>
    <p>Or copy this link: ${escapeHtml(acceptLink)}</p>
    <p>— The Socialbud team</p>
  `;
  const text = [
    "Hello,",
    `${inviterDisplayName || "A teammate"} has invited you to join the workspace ${accountName} on Socialbud.`,
    `Accept invitation: ${acceptLink}`,
    "— The Socialbud team",
  ].join("\n");
  return sendEmail({ to, subject, html, text });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
