-- Migration: 004_alter_profiles_add_org
-- Description: Link each profile to its organization (shared-table tenancy).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(org_id);
