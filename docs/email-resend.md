# Email with Resend

## 1. Supabase auth emails (recommended first)

Use Resend as **custom SMTP** in Supabase so **auth emails** (signup confirmation, password reset, magic link) are sent via Resend. That avoids Supabase’s default rate limits and improves deliverability.

### In Resend

1. Sign up at [resend.com](https://resend.com).
2. **Verify your domain** (required for production; for testing you can use Resend’s sandbox domain).
3. **API Keys** → Create API Key (you’ll use this as the SMTP password).

### In Supabase

1. **Project** → **Authentication** → **Providers** (or **Auth** → **Email**).
2. Open **SMTP Settings** (or **Custom SMTP** / **Email** config).
3. Enable custom SMTP and set:

   | Field        | Value              |
   |-------------|--------------------|
   | Sender email | Your verified address (e.g. `noreply@yourdomain.com`) or Resend sandbox |
   | Sender name  | e.g. `Socialbud`   |
   | Host         | `smtp.resend.com`  |
   | Port         | `465` (SSL) or `587` (TLS) |
   | Username     | `resend`           |
   | Password     | Your **Resend API key** |

4. Save. Auth emails (confirm signup, recover, magic link) will go through Resend.

---

## 2. App-sent emails (your code)

When **your app** needs to send emails (notifications, invites, etc.), use Resend’s API from the backend.

- Add **RESEND_API_KEY** to your env (e.g. `apps/web/.env` or root `.env`).
- In the app (e.g. Next.js API route or Brain worker), call Resend’s API or use the `resend` npm package.

Example env:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
```

We can add a small `sendEmail()` helper and an API route or server action when you’re ready to send from the app.
