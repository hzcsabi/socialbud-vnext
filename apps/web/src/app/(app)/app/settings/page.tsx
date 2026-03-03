import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCurrentUserOrganization } from "@/lib/organization";
import { listMembers, listPendingInvitations } from "./users/actions";
import { SettingsTabs } from "./settings-tabs";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, company_name, website")
    .eq("user_id", user.id)
    .maybeSingle();

  const profileData = {
    display_name: profile?.display_name ?? null,
    company_name: profile?.company_name ?? null,
    website: profile?.website ?? null,
  };

  let organization: Awaited<ReturnType<typeof getCurrentUserOrganization>> = null;
  let members: Awaited<ReturnType<typeof listMembers>>["members"] = [];
  let pendingInvitations: Awaited<ReturnType<typeof listPendingInvitations>>["invitations"] = [];
  try {
    organization = await getCurrentUserOrganization();
    if (organization) {
      const membersResult = await listMembers(organization.id);
      const invitationsResult = await listPendingInvitations(organization.id);
      members = membersResult.members ?? [];
      pendingInvitations = invitationsResult.invitations ?? [];
    }
  } catch {
    organization = null;
    members = [];
    pendingInvitations = [];
  }

  return (
    <SettingsTabs
      profile={profileData}
      organization={organization}
      members={members}
      pendingInvitations={pendingInvitations}
    />
  );
}
