import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCurrentUserAccount } from "@/lib/account";
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

  let account: Awaited<ReturnType<typeof getCurrentUserAccount>> = null;
  let members: Awaited<ReturnType<typeof listMembers>>["members"] = [];
  let pendingInvitations: Awaited<ReturnType<typeof listPendingInvitations>>["invitations"] = [];
  try {
    account = await getCurrentUserAccount();
    if (account) {
      const membersResult = await listMembers(account.id);
      const invitationsResult = await listPendingInvitations(account.id);
      members = membersResult.members ?? [];
      pendingInvitations = invitationsResult.invitations ?? [];
    }
  } catch {
    account = null;
    members = [];
    pendingInvitations = [];
  }

  return (
    <SettingsTabs
      profile={profileData}
      account={account}
      members={members}
      pendingInvitations={pendingInvitations}
    />
  );
}
