"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server-admin";

export async function getInvitationByToken(token: string): Promise<{
  valid: boolean;
  email?: string;
  organizationName?: string;
}> {
  if (!token?.trim()) return { valid: false };

  try {
    const supabase = createServiceRoleClient();
    const { data: row, error } = await supabase
      .from("organization_invitations")
      .select("email, status, expires_at, organization_id")
      .eq("token", token.trim())
      .single();

    if (error || !row) return { valid: false };
    if (row.status !== "pending") return { valid: false };
    if (new Date(row.expires_at) <= new Date()) return { valid: false };

    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", row.organization_id)
      .single();

    return {
      valid: true,
      email: row.email,
      organizationName: org?.name ?? "the workspace",
    };
  } catch {
    return { valid: false };
  }
}

export async function acceptInvitation(token: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const trimmed = token?.trim();
  if (!trimmed) return { error: "Invalid token" };

  try {
    const adminSupabase = createServiceRoleClient();
    const { data: row, error: fetchError } = await adminSupabase
      .from("organization_invitations")
      .select("id, organization_id, email, status, expires_at")
      .eq("token", trimmed)
      .single();

    if (fetchError || !row) return { error: "Invitation not found" };
    if (row.status !== "pending") return { error: "Invitation is no longer valid" };
    if (new Date(row.expires_at) <= new Date()) return { error: "Invitation has expired" };

    const inviteEmail = (row.email ?? "").toLowerCase();
    const userEmail = (user.email ?? "").toLowerCase();
    if (inviteEmail !== userEmail) {
      return { error: "This invitation was sent to a different email address" };
    }

    const { error: insertError } = await adminSupabase.from("organization_members").insert({
      organization_id: row.organization_id,
      user_id: user.id,
      role: "member",
    });

    if (insertError) {
      if (insertError.code === "23505") {
        await adminSupabase
          .from("organization_invitations")
          .update({ status: "accepted" })
          .eq("id", row.id);
        return {};
      }
      return { error: insertError.message };
    }

    const { error: updateError } = await adminSupabase
      .from("organization_invitations")
      .update({ status: "accepted" })
      .eq("id", row.id);

    if (updateError) return { error: updateError.message };
    return {};
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to accept invitation";
    return { error: msg };
  }
}
