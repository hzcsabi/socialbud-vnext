import { EnqueueButton } from "./enqueue-button";

export default function AppPage() {
  return (
    <main>
      <h1 className="text-xl font-semibold">App</h1>
      <p className="mt-2 text-gray-600">Protected app route. You are signed in.</p>
      <EnqueueButton />
    </main>
  );
}
