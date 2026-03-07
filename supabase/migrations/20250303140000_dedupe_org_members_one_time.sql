-- One-time cleanup: keep the earliest membership per user, remove duplicates, then delete orphan orgs.
-- Run once to fix duplicate organizations/members created before ensure-org was stabilized.

-- 1. Delete all organization_members that are NOT the earliest (by created_at) for each user.
--    Each user ends up with exactly one membership (their first).
DELETE FROM organization_members om
WHERE om.id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM organization_members
  ORDER BY user_id, created_at ASC
);

-- 2. Delete organizations that have no members left.
--    organization_invitations and organization_billing CASCADE on organizations(id).
DELETE FROM organizations
WHERE id NOT IN (
  SELECT organization_id FROM organization_members
);
