import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Socialbud</h1>
      <p className="mt-2 text-muted-foreground">Marketing home. vNext monorepo.</p>
      <div className="mt-4 flex gap-3">
        <Link href="/app" className={cn(buttonVariants())}>
          Go to app
        </Link>
        <Link
          href="/components"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Component library
        </Link>
      </div>
    </main>
  );
}
