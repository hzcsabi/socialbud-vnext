import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Socialbud</h1>
      <p className="mt-2 text-gray-600">Marketing home. vNext monorepo.</p>
      <Link
        href="/app"
        className="mt-4 inline-block rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
      >
        Go to app
      </Link>
    </main>
  );
}
