-- ============================================================================
-- MedySure full database setup (migrations 001 - 005, in order).
-- Safe to run on a fresh Supabase project. Idempotent where practical.
-- Apply via: Supabase Dashboard -> SQL Editor -> paste -> Run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 001: profiles (extends auth.users) + shared updated_at trigger function
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active) WHERE is_active = true;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 002: organizations (tenants)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at ON organizations(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 003: permission / permission-group access control (no roles)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (resource, action)
);

CREATE TABLE IF NOT EXISTS permission_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_permission_groups_org_name
  ON permission_groups(org_id, name) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_permission_groups_system_name
  ON permission_groups(name) WHERE org_id IS NULL AND deleted_at IS NULL;

DROP TRIGGER IF EXISTS update_permission_groups_updated_at ON permission_groups;
CREATE TRIGGER update_permission_groups_updated_at
  BEFORE UPDATE ON permission_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS permission_group_items (
  group_id UUID NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_permission_groups (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, group_id)
);
CREATE INDEX IF NOT EXISTS idx_user_permission_groups_user ON user_permission_groups(user_id);

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, permission_id)
);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);

-- Seed: permission catalog
INSERT INTO permissions (resource, action, description) VALUES
  ('*',            '*',     'Full access to everything'),
  ('patients',     'read',  'View patients'),
  ('patients',     'write', 'Create and update patients'),
  ('appointments', 'read',  'View appointments'),
  ('appointments', 'write', 'Create and update appointments'),
  ('billing',      'read',  'View billing'),
  ('billing',      'write', 'Manage billing'),
  ('staff',        'read',  'View staff'),
  ('staff',        'write', 'Manage staff'),
  ('settings',     'read',  'View organization settings'),
  ('settings',     'write', 'Manage organization settings')
ON CONFLICT (resource, action) DO NOTHING;

-- Seed: system permission-group templates
INSERT INTO permission_groups (name, description, is_system) VALUES
  ('Owner',     'Full administrative access to the organization', true),
  ('Staff',     'Day-to-day clinical and scheduling access', true),
  ('Read-only', 'View-only access', true)
ON CONFLICT (name) WHERE org_id IS NULL AND deleted_at IS NULL DO NOTHING;

INSERT INTO permission_group_items (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
CROSS JOIN permissions p
WHERE g.name = 'Owner' AND g.org_id IS NULL
  AND p.resource = '*' AND p.action = '*'
ON CONFLICT DO NOTHING;

INSERT INTO permission_group_items (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p
  ON (p.resource, p.action) IN
     (('patients','read'),('patients','write'),
      ('appointments','read'),('appointments','write'),
      ('billing','read'))
WHERE g.name = 'Staff' AND g.org_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO permission_group_items (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.action = 'read'
WHERE g.name = 'Read-only' AND g.org_id IS NULL
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 004: link profiles to organizations
-- ---------------------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(org_id);

-- ---------------------------------------------------------------------------
-- 005: auto-provision org + profile + Owner group on every new auth user
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_local      TEXT;
  v_org_name   TEXT;
  v_slug       TEXT;
  v_first_name TEXT;
  v_last_name  TEXT;
  v_org_id     UUID;
  v_owner_group_id UUID;
BEGIN
  v_local := split_part(NEW.email, '@', 1);

  v_first_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), v_local);
  v_last_name  := COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), '');

  v_org_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'org_name', ''),
    initcap(v_local) || '''s Organization'
  );

  v_slug := lower(regexp_replace(v_local, '[^a-zA-Z0-9]+', '-', 'g'))
            || '-' || NEW.id::text;

  INSERT INTO organizations (name, slug, created_by)
  VALUES (v_org_name, v_slug, NEW.id)
  RETURNING id INTO v_org_id;

  INSERT INTO profiles (id, first_name, last_name, org_id)
  VALUES (NEW.id, v_first_name, v_last_name, v_org_id);

  SELECT id INTO v_owner_group_id
  FROM permission_groups
  WHERE name = 'Owner' AND org_id IS NULL AND deleted_at IS NULL
  LIMIT 1;

  IF v_owner_group_id IS NULL THEN
    RAISE EXCEPTION 'Owner permission group not found; apply migration 003 before creating users';
  END IF;

  INSERT INTO user_permission_groups (user_id, group_id, org_id)
  VALUES (NEW.id, v_owner_group_id, v_org_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ---------------------------------------------------------------------------
-- 006: public "request a demo" submissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_no VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON demo_requests(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at ON demo_requests(created_at);

DROP TRIGGER IF EXISTS update_demo_requests_updated_at ON demo_requests;
CREATE TRIGGER update_demo_requests_updated_at
  BEFORE UPDATE ON demo_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
