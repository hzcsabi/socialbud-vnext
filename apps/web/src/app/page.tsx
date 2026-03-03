import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Socialbud Website</h1>
        <p className="text-muted-foreground">
          This will be the fancy new website.
        </p>
        <div className="pt-2">
          <Link href="/app" className={cn(buttonVariants())}>
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
