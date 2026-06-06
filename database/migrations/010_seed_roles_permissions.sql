-- Migration: 010_seed_roles_permissions
-- Description: Seed default roles and permissions

-- Insert roles
INSERT INTO roles (name, description, is_system) VALUES
  ('super_admin', 'Super Administrator with full access', true),
  ('admin', 'Administrator with management access', true),
  ('doctor', 'Doctor with patient and appointment access', true),
  ('nurse', 'Nurse with limited patient access', true),
  ('receptionist', 'Receptionist with scheduling access', true),
  ('patient', 'Patient with self-service access', true)
ON CONFLICT (name) DO NOTHING;

-- Insert permissions
INSERT INTO permissions (resource, action, description) VALUES
  -- Patient permissions
  ('patient', 'create', 'Create new patient records'),
  ('patient', 'read', 'View patient records'),
  ('patient', 'update', 'Update patient records'),
  ('patient', 'delete', 'Delete patient records'),
  ('patient', 'list', 'List all patients'),
  -- Doctor permissions
  ('doctor', 'create', 'Create new doctor records'),
  ('doctor', 'read', 'View doctor records'),
  ('doctor', 'update', 'Update doctor records'),
  ('doctor', 'delete', 'Delete doctor records'),
  ('doctor', 'list', 'List all doctors'),
  -- Appointment permissions
  ('appointment', 'create', 'Create appointments'),
  ('appointment', 'read', 'View appointments'),
  ('appointment', 'update', 'Update appointments'),
  ('appointment', 'cancel', 'Cancel appointments'),
  ('appointment', 'list', 'List appointments'),
  -- Billing permissions
  ('billing', 'create', 'Create billing records'),
  ('billing', 'read', 'View billing records'),
  ('billing', 'update', 'Update billing records'),
  -- Staff permissions
  ('staff', 'manage', 'Manage staff members'),
  -- Analytics permissions
  ('analytics', 'view', 'View analytics and reports'),
  -- Settings permissions
  ('settings', 'manage', 'Manage system settings'),
  -- Notification permissions
  ('notification', 'read', 'View notifications')
ON CONFLICT (resource, action) DO NOTHING;

-- Assign all permissions to super_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Assign all permissions to admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Doctor permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'doctor' AND (
  (p.resource = 'patient' AND p.action IN ('read', 'update', 'list')) OR
  (p.resource = 'doctor' AND p.action IN ('read', 'update', 'list')) OR
  (p.resource = 'appointment' AND p.action IN ('create', 'read', 'update', 'cancel', 'list')) OR
  (p.resource = 'analytics' AND p.action = 'view') OR
  (p.resource = 'notification' AND p.action = 'read')
)
ON CONFLICT DO NOTHING;

-- Nurse permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'nurse' AND (
  (p.resource = 'patient' AND p.action IN ('read', 'list')) OR
  (p.resource = 'doctor' AND p.action IN ('read', 'list')) OR
  (p.resource = 'appointment' AND p.action IN ('create', 'read', 'list')) OR
  (p.resource = 'notification' AND p.action = 'read')
)
ON CONFLICT DO NOTHING;

-- Receptionist permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'receptionist' AND (
  (p.resource = 'patient' AND p.action IN ('create', 'read', 'update', 'list')) OR
  (p.resource = 'doctor' AND p.action IN ('read', 'list')) OR
  (p.resource = 'appointment' AND p.action IN ('create', 'read', 'update', 'cancel', 'list')) OR
  (p.resource = 'billing' AND p.action IN ('create', 'read')) OR
  (p.resource = 'notification' AND p.action = 'read')
)
ON CONFLICT DO NOTHING;

-- Patient permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'patient' AND (
  (p.resource = 'patient' AND p.action IN ('read')) OR
  (p.resource = 'doctor' AND p.action IN ('read', 'list')) OR
  (p.resource = 'appointment' AND p.action IN ('create', 'read', 'update', 'cancel')) OR
  (p.resource = 'billing' AND p.action = 'read') OR
  (p.resource = 'notification' AND p.action = 'read')
)
ON CONFLICT DO NOTHING;
