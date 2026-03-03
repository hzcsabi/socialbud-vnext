# Auth callback (email confirmation / magic link / set password)

After a user clicks the confirmation or recovery link in the email, Supabase can redirect them with the session in the URL **hash** (default) or with **query params** so the server can set cookies.

## What we do in the app

1. **Hash fallback (default emails)**  
   When the URL contains `#access_token=...&refresh_token=...`, a client component (`AuthHashHandler`) runs, calls `setSession()` so the session is stored in cookies, then redirects:
   - **recovery** or **signup** → `/auth/set-password` (so they can set or reset their password)
   - otherwise → `/app`

2. **Server callback**  
   The `/auth/callback` route accepts `token_hash`, `type`, and optional `next`. It verifies the OTP, sets cookies, and redirects to `next` (default `/app`).

3. **Set password page**  
   At `/auth/set-password`, the user (with a session from the link) enters a new password. Used for first-time setup and password reset.

---

## URLs to put in Supabase email templates

In **Authentication → Email Templates**, set the link in each template as below. Use your real **Site URL** (e.g. `https://yourapp.com` or `http://localhost:3000`).

### Confirm signup (first-time set password)

So new users land on the set-password page after confirming their email:

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/auth/set-password">Confirm your email</a>
```

If you use the **default** Supabase redirect (no custom template), the hash handler will send `type=signup` users to `/auth/set-password` automatically.

### Recover password (reset password)

So users who forgot their password land on the set-password page:

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/auth/set-password">Reset password</a>
```

### Magic link (sign in without set-password)

To go straight to the app:

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink&next=/app">Log in</a>
```

---

## Redirect URLs

In Supabase: **Authentication → URL Configuration → Redirect URLs**, add:

- `http://localhost:3000/auth/callback` (and `/auth/set-password` if you want to allow direct links)
- Production: `https://yourdomain.com/auth/callback`

## Site URL

Set **Site URL** to your app (e.g. `http://localhost:3000` or your production URL). This is where Supabase redirects by default when no custom template is used.
