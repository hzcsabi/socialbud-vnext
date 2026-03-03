import { getAdminUser } from "@/lib/admin";
import { listAdmins } from "./actions";
import { AddAdminForm } from "./add-admin-form";
import { RemoveAdminButton } from "./remove-admin-button";

export default async function TeamAccessPage() {
  const admin = await getAdminUser();
  const { admins, error: listError } = await listAdmins();
  const currentUserId = admin?.user.id ?? null;

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Team access</h1>
      <p className="mt-1 text-sm text-gray-600">
        Users listed here can sign in to the admin area at /admin.
      </p>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-gray-900">Add admin</h2>
        <p className="mt-1 text-sm text-gray-600">
          Enter the email of an existing user to grant them admin access.
        </p>
        <AddAdminForm />
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-gray-900">Current admins</h2>
        {listError ? (
          <p className="mt-2 text-sm text-amber-600">
            {listError}. Ensure SUPABASE_SERVICE_ROLE_KEY is set in your env.
          </p>
        ) : admins.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No admins yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-200 rounded border border-gray-200">
            {admins.map((a) => (
              <li
                key={a.user_id}
                className="flex items-center justify-between px-3 py-2 text-sm"
              >
                <span className="text-gray-900">{a.email ?? a.user_id}</span>
                <RemoveAdminButton
                  userId={a.user_id}
                  disabled={a.user_id === currentUserId}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
