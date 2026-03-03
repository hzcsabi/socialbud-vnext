import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ConfigError } from "./config-error";
import { cn } from "@/lib/utils";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, company_name, website")
    .eq("user_id", user.id)
    .maybeSingle();
  const incomplete = !profile || !profile.display_name?.trim();
  if (incomplete) redirect("/onboarding");

  const displayName = profile.display_name?.trim() || user.email || "Account";

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r border-border bg-muted/30">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Link
            href="/app"
            className={cn(
              "flex items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            <Image
              src="/app-logo-light.svg"
              alt="Socialbud"
              className="h-[1.6rem] w-auto dark:hidden"
              width={120}
              height={32}
            />
            <Image
              src="/app-logo-dark.svg"
              alt="Socialbud"
              className="h-[1.6rem] w-auto hidden dark:block"
              width={120}
              height={32}
            />
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          <Link
            href="/app"
            className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Assistant
          </Link>
          <Link
            href="/app/calendar"
            className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Calendar
          </Link>
          <Link
            href="/app/posts"
            className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Posts
          </Link>
          <Link
            href="/app/clips"
            className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Clips
          </Link>
          <Link
            href="/app/campaigns"
            className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Campaigns
          </Link>
          <Link
            href="/app/image-gallery"
            className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Image Gallery
          </Link>
          <Link
            href="/app/comments"
            className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Comments
          </Link>
          <Link
            href="/app/settings"
            className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Settings
          </Link>
        </nav>
        <div className="border-t border-border p-3 text-sm">
          <p className="truncate font-medium">{displayName}</p>
          {user.email && (
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          )}
          <form action="/api/auth/signout" method="post" className="mt-2">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
