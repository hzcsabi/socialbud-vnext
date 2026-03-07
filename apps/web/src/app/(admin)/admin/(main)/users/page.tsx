import { getAdminUser } from "@/lib/admin";
import { listUsersForAdmin, listOrganizationsForAdmin } from "./actions";
import { AdminUsersContent } from "./admin-users-content";

export default async function AdminUsersPage() {
  const admin = await getAdminUser();
  const [{ users, error }, { organizations: orgs, error: orgsError }] =
    await Promise.all([listUsersForAdmin(), listOrganizationsForAdmin()]);
  const currentUserId = admin?.user.id ?? null;

  return (
    <div>
      <h1 className="text-xl font-semibold">Users</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Users who have signed up. Name and website come from their profile (onboarding or account).
      </p>
      <AdminUsersContent
        users={users}
        organizations={orgs}
        currentUserId={currentUserId}
        error={error}
        orgsError={orgsError}
      />
    </div>
  );
}
