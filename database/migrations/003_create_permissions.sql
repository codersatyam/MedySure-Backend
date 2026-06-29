-- Migration: 003_create_permissions
-- Description: Permission / permission-group access control (no roles).
--   - permissions          : atomic capabilities, e.g. patients:read
--   - permission_groups     : named bundles (system templates have org_id NULL)
--   - permission_group_items: group -> permissions mapping
--   - user_permission_groups: groups granted to a user (scoped to an org)
--   - user_permissions      : one-off direct grants to a user (scoped to an org)

-- --- Atomic permissions ---------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (resource, action)
);

-- --- Permission groups (bundles) ------------------------------------------
-- org_id NULL => system template available to every org (e.g. Owner).
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

-- A group name is unique within its org; system templates (org_id NULL) are
-- unique among themselves.
CREATE UNIQUE INDEX IF NOT EXISTS uq_permission_groups_org_name
  ON permission_groups(org_id, name) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_permission_groups_system_name
  ON permission_groups(name) WHERE org_id IS NULL AND deleted_at IS NULL;

DROP TRIGGER IF EXISTS update_permission_groups_updated_at ON permission_groups;
CREATE TRIGGER update_permission_groups_updated_at
  BEFORE UPDATE ON permission_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- --- Group -> permission mapping ------------------------------------------
CREATE TABLE IF NOT EXISTS permission_group_items (
  group_id UUID NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, permission_id)
);

-- --- User -> group grants --------------------------------------------------
CREATE TABLE IF NOT EXISTS user_permission_groups (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, group_id)
);
CREATE INDEX IF NOT EXISTS idx_user_permission_groups_user ON user_permission_groups(user_id);

-- --- User -> direct permission grants -------------------------------------
CREATE TABLE IF NOT EXISTS user_permissions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, permission_id)
);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);

-- --- Seed: permission catalog ---------------------------------------------
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

-- --- Seed: system permission-group templates ------------------------------
INSERT INTO permission_groups (name, description, is_system) VALUES
  ('Owner',     'Full administrative access to the organization', true),
  ('Staff',     'Day-to-day clinical and scheduling access', true),
  ('Read-only', 'View-only access', true)
ON CONFLICT (name) WHERE org_id IS NULL AND deleted_at IS NULL DO NOTHING;

-- Owner template => the *:* wildcard (full access).
INSERT INTO permission_group_items (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
CROSS JOIN permissions p
WHERE g.name = 'Owner' AND g.org_id IS NULL
  AND p.resource = '*' AND p.action = '*'
ON CONFLICT DO NOTHING;

-- Staff template => read/write on patients & appointments, read on billing.
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

-- Read-only template => every :read permission.
INSERT INTO permission_group_items (group_id, permission_id)
SELECT g.id, p.id
FROM permission_groups g
JOIN permissions p ON p.action = 'read'
WHERE g.name = 'Read-only' AND g.org_id IS NULL
ON CONFLICT DO NOTHING;
