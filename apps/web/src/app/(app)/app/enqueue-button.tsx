"use client";

import { useState } from "react";

export function EnqueueButton() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEnqueue() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/jobs/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "demo", payload: { ts: Date.now() } }),
      });
      const data = await res.json();
      if (res.ok) setResult(`Job enqueued: ${data.id}`);
      else setResult(`Error: ${data.error ?? res.statusText}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleEnqueue}
        disabled={loading}
        className="rounded bg-gray-800 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {loading ? "Enqueueing…" : "Enqueue demo job"}
      </button>
      {result && <p className="mt-2 text-sm text-gray-600">{result}</p>}
    </div>
  );
}
