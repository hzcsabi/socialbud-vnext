"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      Remove
    </Button>
  );
}
