"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server-admin";
import {
  getCurrentUserOrganization,
  ensureCurrentUserOrganization,
} from "@/lib/organization";
import { sendInvitationEmail } from "@/lib/email";

const INVITATION_EXPIRY_DAYS = 7;

function appOrigin(): string {
  return (
    process.env["NEXT_PUBLIC_APP_URL"] ??
    (typeof process.env["VERCEL_URL"] !== "undefined"
      ? `https://${process.env["VERCEL_URL"]}`
      : "http://localhost:3000")
  );
}

async function ensureOwnerOrAdmin(organizationId: string): Promise<boolean> {
  const org = await getCurrentUserOrganization();
  return org?.id === organizationId;
}

export type MemberRow = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  role: string;
};

export async function listMembers(
  organizationId: string
): Promise<{ members: MemberRow[]; error?: string }> {
  const ok = await ensureOwnerOrAdmin(organizationId);
  if (!ok) return { members: [], error: "Unauthorized" };

  try {
    const supabase = await createClient();
    const { data: rows, error: listError } = await supabase
      .from("organization_members")
      .select("user_id, role")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true });

    if (listError) return { members: [], error: listError.message };
    if (!rows?.length) return { members: [] };

    const adminSupabase = createServiceRoleClient();
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", rows.map((r) => r.user_id));

    const profileByUserId = new Map(
      (profiles ?? []).map((p) => [p.user_id, p.display_name ?? null])
    );

    const members: MemberRow[] = [];
    for (const row of rows) {
      const {
        data: { user },
      } = await adminSupabase.auth.admin.getUserById(row.user_id);
      members.push({
        user_id: row.user_id,
        email: user?.email ?? null,
        display_name: profileByUserId.get(row.user_id) ?? null,
        role: row.role,
      });
    }
    return { members };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to list members";
    return { members: [], error: msg };
  }
}

export type PendingInvitationRow = {
  id: string;
  email: string;
  created_at: string;
};

export async function listPendingInvitations(
  organizationId: string
): Promise<{ invitations: PendingInvitationRow[]; error?: string }> {
  const ok = await ensureOwnerOrAdmin(organizationId);
  if (!ok) return { invitations: [], error: "Unauthorized" };

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("organization_invitations")
    .select("id, email, created_at")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return { invitations: [], error: error.message };
  return {
    invitations: (rows ?? []).map((r) => ({
      id: r.id,
      email: r.email,
      created_at: r.created_at,
    })),
  };
}

export async function createInvitation(
  organizationId: string,
  email: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return {
      error: "Not authenticated. Please refresh the page and try again.",
    };
  }

  let org = await getCurrentUserOrganization();
  if (!org) {
    try {
      await ensureCurrentUserOrganization();
      org = await getCurrentUserOrganization();
    } catch {
      // ensure failed (e.g. service role env missing)
    }
  }
  if (!org || org.id !== organizationId) {
    return {
      error: org
        ? "Unauthorized"
        : "Your workspace could not be loaded. Please refresh the page and try again.",
    };
  }

  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { error: "Email is required" };

  try {
    const adminSupabase = createServiceRoleClient();

    const { data: members } = await adminSupabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", organizationId);

    const userIds = (members ?? []).map((m) => m.user_id);
    for (const uid of userIds) {
      const {
        data: { user },
      } = await adminSupabase.auth.admin.getUserById(uid);
      if (user?.email?.toLowerCase() === trimmed) {
        return { error: "This user is already a member" };
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);
    const token = crypto.randomUUID();

    const { error: insertError } = await supabase
      .from("organization_invitations")
      .insert({
        organization_id: organizationId,
        email: trimmed,
        invited_by_user_id: authUser.id,
        token,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      if (insertError.code === "23505") {
        return { error: "An invitation has already been sent to this email" };
      }
      return { error: insertError.message };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", authUser.id)
      .maybeSingle();

    const acceptLink = `${appOrigin()}/invite/accept?token=${encodeURIComponent(token)}`;
    const { sent, error: emailError } = await sendInvitationEmail({
      to: trimmed,
      inviterDisplayName: profile?.display_name ?? authUser.email ?? "A teammate",
      organizationName: org.name,
      acceptLink,
    });

    if (!sent && emailError) {
      return { error: `Invitation created but email failed: ${emailError}` };
    }
    return {};
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create invitation";
    return { error: msg };
  }
}

export async function revokeInvitation(
  invitationId: string,
  organizationId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return {
      error: "Not authenticated. Please refresh the page and try again.",
    };
  }
  let org = await getCurrentUserOrganization();
  if (!org) {
    try {
      await ensureCurrentUserOrganization();
      org = await getCurrentUserOrganization();
    } catch {
      // ignore
    }
  }
  if (!org || org.id !== organizationId) {
    return {
      error: org
        ? "Unauthorized"
        : "Your workspace could not be loaded. Please refresh the page and try again.",
    };
  }

  const { error } = await supabase
    .from("organization_invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("organization_id", organizationId)
    .eq("status", "pending");

  if (error) return { error: error.message };
  return {};
}

export async function resendInvitation(
  invitationId: string,
  organizationId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return {
      error: "Not authenticated. Please refresh the page and try again.",
    };
  }
  let org = await getCurrentUserOrganization();
  if (!org) {
    try {
      await ensureCurrentUserOrganization();
      org = await getCurrentUserOrganization();
    } catch {
      // ignore
    }
  }
  if (!org || org.id !== organizationId) {
    return {
      error: org
        ? "Unauthorized"
        : "Your workspace could not be loaded. Please refresh the page and try again.",
    };
  }

  const { data: row, error: fetchError } = await supabase
    .from("organization_invitations")
    .select("id, email, token")
    .eq("id", invitationId)
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .single();

  if (fetchError || !row) return { error: "Invitation not found or no longer pending" };

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

  await supabase
    .from("organization_invitations")
    .update({ expires_at: expiresAt.toISOString() })
    .eq("id", invitationId);

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", authUser.id)
    .maybeSingle();

  const acceptLink = `${appOrigin()}/invite/accept?token=${encodeURIComponent(row.token)}`;
  const { sent, error: emailError } = await sendInvitationEmail({
    to: row.email,
    inviterDisplayName: profile?.display_name ?? authUser.email ?? "A teammate",
    organizationName: org.name,
    acceptLink,
  });

  if (!sent && emailError) return { error: emailError };
  return {};
}
