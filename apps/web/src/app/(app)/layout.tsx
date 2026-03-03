import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <div className="min-h-screen p-8">
      <header className="mb-6 flex items-center justify-between border-b pb-4">
        <span className="text-sm text-gray-600">{user.email}</span>
        <form action="/api/auth/signout" method="post">
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Sign out
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
