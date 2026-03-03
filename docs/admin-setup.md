# Admin setup

The admin area lives at `/admin` and is invite-only. Only users listed in the `admins` table can access it.

## Adding the first admin

You must add the first admin manually (one-time), because only existing admins can use the Team access UI.

1. Create a user in Supabase (Authentication → Users), or use an existing user.
2. Run in the Supabase SQL Editor:

```sql
INSERT INTO admins (user_id) SELECT id FROM auth.users WHERE email = 'your-admin@example.com';
```

Or with a known user ID:

```sql
INSERT INTO admins (user_id) VALUES ('uuid-of-the-user-here');
```

3. Sign in at `/admin/login` with that user’s email and password.

## Adding more admins (Team access UI)

Once you have at least one admin:

1. Set **SUPABASE_SERVICE_ROLE_KEY** in your env (Supabase Dashboard → Project Settings → API → service_role secret). This is used only on the server for listing users and updating the `admins` table.
2. In the app, go to **Admin → Team access**. There you can add an admin by email (the user must already exist in Authentication → Users) and remove admin access. You cannot remove your own admin access.
