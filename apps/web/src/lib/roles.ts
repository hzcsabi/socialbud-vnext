/**
 * Account member role type and UI helpers. Single source of truth for role semantics in the web app.
 */

export type MemberRole = "owner" | "manager" | "member";

export const MEMBER_ROLES: MemberRole[] = ["owner", "manager", "member"];

export function roleLabel(role: MemberRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "manager":
      return "Manager";
    case "member":
      return "Member";
    default:
      return role;
  }
}

export function roleClass(role: MemberRole): string {
  switch (role) {
    case "owner":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
    case "manager":
      return "bg-blue-500/15 text-blue-700 dark:text-blue-400";
    case "member":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}
