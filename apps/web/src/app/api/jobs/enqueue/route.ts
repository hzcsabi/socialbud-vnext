import { createClient } from "@/lib/supabase/server";
import { enqueueJobBodySchema } from "@socialbud/shared";
import { NextResponse } from "next/server";

const BRAIN_URL = process.env["BRAIN_URL"] ?? "http://127.0.0.1:3001";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = enqueueJobBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const res = await fetch(`${BRAIN_URL}/jobs/enqueue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...parsed.data,
      payload: { ...parsed.data.payload, userId: user.id },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      data?.error ?? { error: "Brain request failed" },
      { status: res.status }
    );
  }
  return NextResponse.json(data, { status: 202 });
}
