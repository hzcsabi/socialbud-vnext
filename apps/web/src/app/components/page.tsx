import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ComponentsPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-12">
        <div>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to home
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Component library
          </h1>
          <p className="mt-1 text-muted-foreground">
            Default styles from shadcn/ui, Tailwind, and typography. Public page
            for review.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Button</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Input</h2>
          <div className="max-w-sm space-y-2">
            <Input placeholder="Placeholder text" />
            <Input type="email" placeholder="Email" />
            <Input type="password" placeholder="Password" />
            <Input placeholder="Disabled" disabled />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Card</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Card title</CardTitle>
                <CardDescription>
                  Short description for the card content.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This is the card body. You can put any content here.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Another card</CardTitle>
                <CardDescription>With different content.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cards use the theme border, background, and shadow.
                </p>
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
                <Button size="sm">Confirm</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Typography (prose)</h2>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h3>Prose heading</h3>
            <p>
              The <code>prose</code> class from @tailwindcss/typography styles
              long-form content. Use it on a wrapper for markdown or HTML
              content.
            </p>
            <ul>
              <li>List item one</li>
              <li>List item two</li>
              <li>List item three</li>
            </ul>
            <blockquote>
              A blockquote for emphasis or citations.
            </blockquote>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Line clamp</h2>
          <p className="text-sm text-muted-foreground">
            Built-in Tailwind utilities: line-clamp-1, line-clamp-2, line-clamp-3
          </p>
          <div className="space-y-2 rounded-md border p-4">
            <p className="line-clamp-1 text-sm">
              This paragraph is limited to one line. Any extra text is truncated
              with an ellipsis so it fits on a single line.
            </p>
            <p className="line-clamp-2 text-sm">
              This one is clamped to two lines. Useful for previews or cards
              where you want to show a short excerpt without taking too much
              space.
            </p>
            <p className="line-clamp-3 text-sm">
              And this is clamped to three lines. You can use any number up to
              line-clamp-none to remove the limit. Good for list items or
              descriptions.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Theme colors</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-md border bg-background p-3 text-center text-sm">
              background
            </div>
            <div className="rounded-md border bg-primary p-3 text-center text-sm text-primary-foreground">
              primary
            </div>
            <div className="rounded-md border bg-secondary p-3 text-center text-sm text-secondary-foreground">
              secondary
            </div>
            <div className="rounded-md border bg-muted p-3 text-center text-sm text-muted-foreground">
              muted
            </div>
            <div className="rounded-md border bg-accent p-3 text-center text-sm text-accent-foreground">
              accent
            </div>
            <div className="rounded-md border bg-destructive p-3 text-center text-sm text-destructive-foreground">
              destructive
            </div>
            <div className="rounded-md border bg-card p-3 text-center text-sm text-card-foreground">
              card
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
