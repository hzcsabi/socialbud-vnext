import { getAdminUser } from "@/lib/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listAdmins } from "./actions";
import { AddAdminForm } from "./add-admin-form";
import { RemoveAdminButton } from "./remove-admin-button";

export default async function TeamAccessPage() {
  const admin = await getAdminUser();
  const { admins, error: listError } = await listAdmins();
  const currentUserId = admin?.user.id ?? null;

  return (
    <div>
      <h1 className="text-xl font-semibold">Team access</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Users listed here can sign in to the admin area at /admin.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Add admin</CardTitle>
          <CardDescription>
            Search for a user by name or email, then add them as an admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddAdminForm />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Current admins</CardTitle>
          {listError ? (
            <p className="text-sm text-destructive">
              {listError}. Ensure SUPABASE_SERVICE_ROLE_KEY is set in your env.
            </p>
          ) : admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admins yet.</p>
          ) : null}
        </CardHeader>
        {!listError && admins.length > 0 ? (
          <CardContent>
            <ul className="divide-y divide-border rounded-md border">
              {admins.map((a) => (
                <li
                  key={a.user_id}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span className="truncate">
                    {a.name ? `${a.name} · ${a.email ?? a.user_id}` : a.email ?? a.user_id}
                  </span>
                  <RemoveAdminButton
                    userId={a.user_id}
                    disabled={a.user_id === currentUserId}
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
