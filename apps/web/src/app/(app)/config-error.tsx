export function ConfigError() {
  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-md rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h1 className="text-lg font-semibold">Configuration required</h1>
        <p className="mt-2 text-sm">
          Supabase is not configured. Add these environment variables in Vercel
          (Project → Settings → Environment Variables):
        </p>
        <ul className="mt-3 list-inside list-disc text-sm font-mono">
          <li>NEXT_PUBLIC_SUPABASE_URL</li>
          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</li>
        </ul>
        <p className="mt-3 text-sm">
          Then redeploy the project. Get the values from Supabase: Project
          Settings → API.
        </p>
      </div>
    </div>
  );
}
