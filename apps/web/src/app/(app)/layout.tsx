import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ConfigError } from "./config-error";

export default async function AppLayout({
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
  if (!user) redirect("/login");
  return (
    <div className="min-h-screen p-8">
      <header className="mb-6 flex items-center justify-between border-b pb-4">
        <span className="text-sm text-muted-foreground">{user.email}</span>
        <form action="/api/auth/signout" method="post">
          <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:text-destructive">
            Sign out
          </Button>
        </form>
      </header>
      {children}
    </div>
  );
}
