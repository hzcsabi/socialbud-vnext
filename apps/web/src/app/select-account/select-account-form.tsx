"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { setSelectedAccount } from "@/lib/account";

type Account = { id: string; name: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="w-full"
      disabled={pending}
    >
      {pending ? (
        <span
          className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : null}
      Continue
    </Button>
  );
}

export function SelectAccountForm({ accounts }: { accounts: Account[] }) {
  return (
    <form
      action={async (formData: FormData) => {
        const accountId = formData.get("account_id") as string;
        if (accountId) await setSelectedAccount(accountId, true);
      }}
      className="space-y-4"
    >
      <label htmlFor="account_id" className="sr-only">
        Account
      </label>
      <select
        id="account_id"
        name="account_id"
        required
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <option value="">Select an account</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>
      <SubmitButton />
    </form>
  );
}
