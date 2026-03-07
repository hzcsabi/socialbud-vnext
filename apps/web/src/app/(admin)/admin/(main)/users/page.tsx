import { getAdminUser } from "@/lib/admin";
import { listUsersForAdmin, listAccountsForAdmin } from "./actions";
import { AdminUsersContent } from "./admin-users-content";

export default async function AdminUsersPage() {
  const admin = await getAdminUser();
  const [{ users, error }, { accounts, error: accountsError }] =
    await Promise.all([listUsersForAdmin(), listAccountsForAdmin()]);
  const currentUserId = admin?.user.id ?? null;

  return (
    <div>
      <h1 className="text-xl font-semibold">Users</h1>
      <AdminUsersContent
        users={users}
        accounts={accounts}
        currentUserId={currentUserId}
        error={error}
        accountsError={accountsError}
      />
    </div>
  );
}
