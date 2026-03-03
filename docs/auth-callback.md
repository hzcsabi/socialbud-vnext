# Auth callback (email confirmation / magic link / set password)

After a user clicks the confirmation or recovery link in the email, Supabase can redirect them with the session in the URL **hash** (default) or with **query params** so the server can set cookies.

## What we do in the app

1. **Hash fallback (default emails)**  
   When the URL contains `#access_token=...&refresh_token=...`, a client component (`AuthHashHandler`) runs, calls `setSession()` so the session is stored in cookies, then redirects:
   - **recovery** → `/auth/set-password` (reset password flow)
   - **signup** or **email** (confirm signup) → `/onboarding` (new users complete profile, then go to app)
   - otherwise → `/app`

2. **Server callback**  
   The `/auth/callback` route accepts `token_hash`, `type`, and optional `next`. It verifies the OTP, sets cookies, and redirects to `next` (default `/app`).

3. **Set password page**  
   At `/auth/set-password`, the user (with a session from the link) enters a new password. Used for first-time setup and password reset.

---

## URLs to put in Supabase email templates

In **Authentication → Email Templates**, set the link in each template as below. Use your real **Site URL** (e.g. `https://yourapp.com` or `http://localhost:3000`).

### Confirm signup (email + password signup)

So new users land on onboarding after confirming their email (they already have a password):

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/onboarding">Confirm your email</a>
```

If you use the **default** Supabase redirect (no custom template), the hash handler will send `type=signup` or `type=email` to `/onboarding` automatically.

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

- `http://localhost:3000/auth/callback` (email templates)
- `http://localhost:3000/auth/oauth-callback` (Google OAuth; "Continue with Google" redirects here)
- `http://localhost:3000/auth/set-password` (optional, for direct links)
- Production: same paths on your production origin (e.g. `https://yourdomain.com/auth/callback`, `https://yourdomain.com/auth/oauth-callback`)

## Site URL

Set **Site URL** to your app (e.g. `http://localhost:3000` or your production URL). This is where Supabase redirects by default when no custom template is used.

---

## Google OAuth

To enable sign-in and sign-up with Google:

1. **Google Cloud Console**
   - Create a project (or use an existing one) and enable the **Google+ API** / **Google Identity** (as required by your console).
   - Go to **APIs & Services → Credentials** and create an **OAuth 2.0 Client ID** (application type: **Web application**).
   - Add **Authorized redirect URIs**: `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback` (find your project ref in Supabase → Settings → API).

2. **Supabase Dashboard**
   - **Authentication → Providers**: enable **Google** and paste the Client ID and Client Secret from the Google Cloud Console.
   - **Authentication → URL Configuration**:
     - **Site URL**: your app origin (e.g. `http://localhost:3000` for local, or your production URL).
     - **Redirect URLs**: include `http://localhost:3000/auth/oauth-callback` (and production `https://yourdomain.com/auth/oauth-callback`). "Continue with Google" sends users to this URL with a `?code=`; the app exchanges it for a session then redirects to `/app` (and to `/onboarding` if profile is incomplete).
   - No extra env vars are required in the app; Supabase uses the provider config from the dashboard.

3. **Testing**
   - **Login** (`/login`): Click "Continue with Google" → redirects to Google → after sign-in, you are sent back to the app. Existing users land in `/app`; new users (or users without a complete profile) are redirected to `/onboarding` by the app layout, then into `/app` after completing onboarding.
   - **Signup** (`/signup`): Same "Continue with Google" flow; first-time users should complete onboarding (profile + individual org) as with email signup.
   - **Email/password**: Sign in, sign up, and forgot-password flows should continue to work unchanged.
