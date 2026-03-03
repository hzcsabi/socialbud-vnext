"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AccountBillingContent } from "./account-billing-content";
import { UsersTabContent } from "./users/users-tab-content";
import type { MemberRow, PendingInvitationRow } from "./users/actions";

type ProfileData = {
  display_name: string | null;
  company_name: string | null;
  website: string | null;
};

type TabId = "brand-kit" | "platforms-schedule" | "users" | "account-billing";

const TABS: { id: TabId; label: string }[] = [
  { id: "brand-kit", label: "Brand Kit" },
  { id: "platforms-schedule", label: "Platforms & Schedule" },
  { id: "users", label: "Users" },
  { id: "account-billing", label: "Account & Billing" },
];

type Props = {
  profile: ProfileData;
  organization: { id: string; name: string } | null;
  members: MemberRow[];
  pendingInvitations: PendingInvitationRow[];
};

export function SettingsTabs({
  profile,
  organization,
  members,
  pendingInvitations,
}: Props) {
  const [active, setActive] = useState<TabId>("account-billing");

  return (
    <div>
      <h1 className="text-xl font-semibold">Settings</h1>
      <div
        className="mt-4 border-b border-border"
        role="tablist"
        aria-label="Settings sections"
      >
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active === tab.id}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              className={cn(
                "rounded-t-md border border-b-0 border-border px-4 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active === tab.id
                  ? "border-border bg-background text-foreground -mb-px"
                  : "border-transparent bg-transparent text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActive(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div
        id="panel-brand-kit"
        role="tabpanel"
        aria-labelledby="tab-brand-kit"
        hidden={active !== "brand-kit"}
        className="mt-6"
      >
        {active === "brand-kit" && (
          <p className="text-sm text-muted-foreground">Coming soon.</p>
        )}
      </div>
      <div
        id="panel-platforms-schedule"
        role="tabpanel"
        aria-labelledby="tab-platforms-schedule"
        hidden={active !== "platforms-schedule"}
        className="mt-6"
      >
        {active === "platforms-schedule" && (
          <p className="text-sm text-muted-foreground">Coming soon.</p>
        )}
      </div>
      <div
        id="panel-users"
        role="tabpanel"
        aria-labelledby="tab-users"
        hidden={active !== "users"}
        className="mt-6"
      >
        {active === "users" &&
          (organization ? (
            <UsersTabContent
              organization={organization}
              members={members}
              pendingInvitations={pendingInvitations}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              You need to be an owner or admin of a workspace to manage members and invitations.
            </p>
          ))}
      </div>
      <div
        id="panel-account-billing"
        role="tabpanel"
        aria-labelledby="tab-account-billing"
        hidden={active !== "account-billing"}
        className="mt-6"
      >
        {active === "account-billing" && <AccountBillingContent profile={profile} />}
      </div>
    </div>
  );
}
