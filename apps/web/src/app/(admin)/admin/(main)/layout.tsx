import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ConfigError } from "@/app/(app)/config-error";

export default async function AdminMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let supabase;
  try {
    supabase = await createClient();
  } catch (err) {
    if (err instanceof Error && err.message === "Missing Supabase env vars") {
      return <ConfigError />;
    }
    throw err;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: adminRow } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!adminRow) redirect("/");
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r border-gray-200 bg-gray-50">
        <div className="flex h-14 items-center border-b border-gray-200 px-4">
          <span className="font-semibold text-gray-900">Socialbud</span>
        </div>
        <nav className="flex-1 p-3">
          <Link
            href="/admin/team-access"
            className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Team access
          </Link>
        </nav>
        <div className="border-t border-gray-200 p-3">
          <form action="/api/auth/signout?redirect=/admin/login" method="post">
            <button
              type="submit"
              className="w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Log out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
