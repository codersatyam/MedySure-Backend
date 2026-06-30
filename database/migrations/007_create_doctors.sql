-- Migration: 007_create_doctors
-- Description: Doctors directory, scoped per organization (standalone records,
--              no auth account). Soft-deleted via deleted_at.

CREATE TABLE IF NOT EXISTS doctors (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name       VARCHAR(100) NOT NULL,
  last_name        VARCHAR(100) NOT NULL,
  email            VARCHAR(255),
  phone            VARCHAR(20),
  specialization   VARCHAR(150),
  qualification    TEXT[] NOT NULL DEFAULT '{}',   -- list, e.g. {'MBBS','MD'}
  age              INTEGER,                          -- doctor's age
  photo_url        TEXT,                             -- profile photo URL
  total_experience NUMERIC(4,1),                     -- years of experience, e.g. 12.5
  consulting_fees  NUMERIC(10,2),                    -- consulting fee amount
  license_number   VARCHAR(100),
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_doctors_org_id ON doctors(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_doctors_created_at ON doctors(created_at);

DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;
CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
