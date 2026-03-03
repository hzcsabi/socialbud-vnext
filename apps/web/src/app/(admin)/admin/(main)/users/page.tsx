import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminUser } from "@/lib/admin";
import { listUsersForAdmin } from "./actions";
import { DeleteUserButton } from "./delete-user-button";

function statusLabel(status: "active" | "pending" | "banned") {
  switch (status) {
    case "active":
      return "Active";
    case "pending":
      return "Pending";
    case "banned":
      return "Banned";
    default:
      return status;
  }
}

function statusClass(status: "active" | "pending" | "banned") {
  switch (status) {
    case "active":
      return "bg-green-500/15 text-green-700 dark:text-green-400";
    case "pending":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
    case "banned":
      return "bg-destructive/15 text-destructive";
    default:
      return "";
  }
}

function orgTypeLabel(kind: "individual" | "team" | "corporation" | null) {
  if (!kind) return "—";
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

export default async function AdminUsersPage() {
  const admin = await getAdminUser();
  const { users, error } = await listUsersForAdmin();
  const currentUserId = admin?.user.id ?? null;

  return (
    <div>
      <h1 className="text-xl font-semibold">Users</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Users who have signed up. Name and website come from their profile (onboarding or account).
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All users</CardTitle>
          <CardDescription>
            Name, email, type (org kind), org name, website, and status (Active = confirmed email; Pending = not yet confirmed; Banned = access revoked).
          </CardDescription>
          {error ? (
            <p className="text-sm text-destructive">
              {error}. Ensure SUPABASE_SERVICE_ROLE_KEY is set in your env.
            </p>
          ) : null}
        </CardHeader>
        {!error && (
          <CardContent>
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">Email</th>
                      <th className="px-4 py-3 text-left font-medium">Type</th>
                      <th className="px-4 py-3 text-left font-medium">Org name</th>
                      <th className="px-4 py-3 text-left font-medium">Website</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">{u.name ?? "—"}</td>
                        <td className="px-4 py-3">{u.email ?? "—"}</td>
                        <td className="px-4 py-3">{orgTypeLabel(u.orgType)}</td>
                        <td className="px-4 py-3">{u.orgName ?? "—"}</td>
                        <td className="px-4 py-3">{u.website ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(u.status)}`}
                          >
                            {statusLabel(u.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DeleteUserButton
                            userId={u.id}
                            email={u.email}
                            disabled={u.id === currentUserId}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
