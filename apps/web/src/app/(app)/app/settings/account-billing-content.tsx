"use client";

import {
  ProfileForm,
  ChangeEmailForm,
  ChangePasswordForm,
} from "@/app/(app)/app/account/account-forms";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteAccountButton } from "./delete-account-button";

type ProfileData = {
  display_name: string | null;
  company_name: string | null;
  website: string | null;
};

type Props = {
  profile: ProfileData;
};

export function AccountBillingContent({ profile }: Props) {
  return (
    <div className="max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Your current plan and billing. Manage your subscription via Stripe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <dl className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <span className="inline-flex rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                  Active
                </span>
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground">Plan</dt>
              <dd className="font-medium">Free</dd>
            </div>
          </dl>
          <Button type="button" variant="outline" size="sm">
            Manage plan
          </Button>
        </CardContent>
      </Card>
      <ProfileForm profile={profile} />
      <ChangeEmailForm />
      <ChangePasswordForm />
      <Card>
        <CardHeader>
          <CardTitle>Delete account</CardTitle>
          <CardDescription>
            Permanently remove your account and all data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountButton />
        </CardContent>
      </Card>
    </div>
  );
}
