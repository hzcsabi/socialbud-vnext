import { createClient } from "@/lib/supabase/server";
import {
  ProfileForm,
  ChangeEmailForm,
  ChangePasswordForm,
} from "./account-forms";
import { Button } from "@/components/ui/button";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

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

  return (
    <main className="max-w-lg space-y-6">
      <h1 className="text-xl font-semibold">Account</h1>
      <ProfileForm profile={profileData} />
      <ChangeEmailForm />
      <ChangePasswordForm />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Sign out is also available in the header.</span>
        <form action="/api/auth/signout" method="post" className="inline">
          <Button type="submit" variant="link" size="sm" className="h-auto p-0 text-destructive">
            Sign out
          </Button>
        </form>
      </div>
    </main>
  );
}
