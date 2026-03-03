# Admin setup

The admin area lives at `/admin` and is invite-only. Only users listed in the `admins` table can access it.

## Adding the first admin

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

## Adding more admins

Use the same `INSERT` in the SQL Editor (or a future “Team access” UI) to add more admin users.
