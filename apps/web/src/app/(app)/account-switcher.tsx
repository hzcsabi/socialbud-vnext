"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { setSelectedAccount } from "@/lib/account";
import { cn } from "@/lib/utils";

type Account = { id: string; name: string };

export function AccountSwitcher({
  currentAccount,
  accounts,
}: {
  currentAccount: Account;
  accounts: Account[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (accounts.length <= 1) {
    return (
      <div className="px-2 py-2 text-sm font-medium text-muted-foreground truncate" title={currentAccount.name}>
        {currentAccount.name}
      </div>
    );
  }

  async function selectAccount(accountId: string) {
    await setSelectedAccount(accountId, false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between gap-1 rounded-md px-2 py-2 text-left text-sm font-medium",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Switch account"
      >
        <span className="truncate">{currentAccount.name}</span>
        <svg
          className="h-4 w-4 shrink-0 opacity-70"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md"
        >
          {accounts.map((account) => (
            <li key={account.id} role="option" aria-selected={account.id === currentAccount.id}>
              <button
                type="button"
                onClick={() => selectAccount(account.id)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm",
                  account.id === currentAccount.id
                    ? "bg-accent font-medium"
                    : "hover:bg-accent/50"
                )}
              >
                {account.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
