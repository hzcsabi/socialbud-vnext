import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
      <aside className="flex w-60 flex-col border-r border-border bg-muted/30">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Link href="/admin" className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded">
            <Image
              src="/admin-logo.svg"
              alt="Socialbud"
              className="h-[1.6rem] w-auto dark:hidden"
              width={120}
              height={32}
            />
            <Image
              src="/admin-logo-dark.svg"
              alt="Socialbud"
              className="h-[1.6rem] w-auto hidden dark:block"
              width={120}
              height={32}
            />
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          <Link
            href="/admin/users"
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            Users
          </Link>
          <Link
            href="/admin/team-access"
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            Team access
          </Link>
          <Link
            href="/admin/corporations"
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            Corporations
          </Link>
          <Link
            href="/admin/pricing-plans"
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            Pricing Plans
          </Link>
          <div className="my-2 border-t border-border" />
          <Link
            href="/admin/templates"
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            Templates
          </Link>
          <Link
            href="/admin/styles"
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            Styles
          </Link>
          <Link
            href="/admin/global-image-gallery"
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            Global Image Gallery
          </Link>
          <div className="my-2 border-t border-border" />
          <Link
            href="/admin/analytics"
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            Analytics
          </Link>
          <Link
            href="/admin/usage-logs"
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            Usage logs
          </Link>
        </nav>
        <div className="border-t border-border p-3 text-sm">
          <p className="truncate font-medium">
            {user.email ?? "Admin"}
          </p>
          <form action="/api/auth/signout?redirect=/admin/login" method="post" className="mt-2">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Log out
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
