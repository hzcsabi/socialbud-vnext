"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

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
      <Button
        type="button"
        variant="secondary"
        onClick={handleEnqueue}
        disabled={loading}
      >
        {loading ? "Enqueueing…" : "Enqueue demo job"}
      </Button>
      {result && <p className="mt-2 text-sm text-muted-foreground">{result}</p>}
    </div>
  );
}
