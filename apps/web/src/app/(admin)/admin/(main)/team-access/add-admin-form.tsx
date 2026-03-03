"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addAdminByEmail } from "./actions";

export function AddAdminForm() {
  const [state, formAction, isPending] = useActionState<{ error?: string }, FormData>(
    async (_prev, formData) => {
      const email = (formData.get("email") as string) ?? "";
      return addAdminByEmail(email);
    },
    {}
  );

  return (
    <form action={formAction} className="mt-4 flex flex-wrap items-end gap-2">
      <label className="flex flex-1 min-w-[200px] flex-col gap-1">
        <span className="text-sm font-medium text-muted-foreground">Email</span>
        <Input
          type="email"
          name="email"
          placeholder="user@example.com"
          required
          disabled={isPending}
        />
      </label>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add admin"}
      </Button>
      {state?.error && (
        <p className="w-full text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
