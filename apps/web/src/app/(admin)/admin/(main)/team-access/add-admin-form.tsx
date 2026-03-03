"use client";

import { useActionState } from "react";
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
        <span className="text-sm font-medium text-gray-700">Email</span>
        <input
          type="email"
          name="email"
          placeholder="user@example.com"
          className="rounded border border-gray-300 px-3 py-2 text-sm"
          required
          disabled={isPending}
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {isPending ? "Adding…" : "Add admin"}
      </button>
      {state?.error && (
        <p className="w-full text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
