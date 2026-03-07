/**
 * Public application URL for links (invites, emails, redirects).
 * Priority: NEXT_PUBLIC_APP_URL → VERCEL_URL (with https://) → http://localhost:3000
 */
export function getAppOrigin(): string {
  return (
    process.env["NEXT_PUBLIC_APP_URL"] ??
    (typeof process.env["VERCEL_URL"] !== "undefined"
      ? `https://${process.env["VERCEL_URL"]}`
      : "http://localhost:3000")
  );
}
