import { getAdminUser } from "@/lib/admin";
import { listUsersForAdmin, listAccountsForAdmin } from "./actions";
import { AdminUsersContent } from "./admin-users-content";

type Props = { searchParams: Promise<{ showDeleted?: string }> };

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const showDeleted = params?.showDeleted === "1";
  const admin = await getAdminUser();
  const [{ users, error }, { accounts, error: accountsError }] = await Promise.all([
    listUsersForAdmin({ includeDeleted: showDeleted }),
    listAccountsForAdmin(),
  ]);
  const currentUserId = admin?.user.id ?? null;

  return (
    <div>
      <h1 className="text-xl font-semibold">Accounts & Users</h1>
      <AdminUsersContent
        users={users}
        accounts={accounts}
        currentUserId={currentUserId}
        showDeleted={showDeleted}
        error={error}
        accountsError={accountsError}
      />
    </div>
  );
}
