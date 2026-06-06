-- Migration: 003_create_patients
-- Description: Create patients table

CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20),
  blood_group VARCHAR(5),
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  address TEXT,
  medical_history JSONB DEFAULT '[]',
  allergies JSONB DEFAULT '[]',
  insurance_provider VARCHAR(200),
  insurance_id VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_patients_profile_id ON patients(profile_id);
CREATE INDEX IF NOT EXISTS idx_patients_deleted_at ON patients(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_is_active ON patients(is_active) WHERE is_active = true;

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
