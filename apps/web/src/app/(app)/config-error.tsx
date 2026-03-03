import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ConfigError() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card className="mx-auto max-w-md border-amber-200 bg-amber-50 text-amber-900">
        <CardHeader>
          <CardTitle>Configuration required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Supabase is not configured. Add these environment variables:
          </p>
          <ul className="list-inside list-disc font-mono">
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</li>
          </ul>
          <p>
            <strong>Local:</strong> Create <code className="rounded bg-amber-100 px-1">apps/web/.env.local</code> with the variables above (see <code className="rounded bg-amber-100 px-1">.env.local.example</code>). Restart the dev server.
          </p>
          <p>
            <strong>Vercel:</strong> Project → Settings → Environment Variables. Then redeploy.
          </p>
          <p>
            Get the values from Supabase: Project Settings → API.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
