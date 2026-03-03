"use client";

import { useRouter } from "next/navigation";
import { removeAdmin } from "./actions";

type Props = { userId: string; disabled?: boolean };

export function RemoveAdminButton({ userId, disabled }: Props) {
  const router = useRouter();

  async function handleClick() {
    if (!confirm("Remove this user’s admin access?")) return;
    const { error } = await removeAdmin(userId);
    if (error) alert(error);
    else router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
    >
      Remove
    </button>
  );
}
