-- Migration: 007_create_billing
-- Description: Create billing_records table

CREATE TABLE IF NOT EXISTS billing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) NOT NULL,
  appointment_id UUID REFERENCES appointments(id),
  amount DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_reference VARCHAR(200),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  items JSONB DEFAULT '[]',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_billing_patient_id ON billing_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_appointment_id ON billing_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_billing_status ON billing_records(status);
CREATE INDEX IF NOT EXISTS idx_billing_due_date ON billing_records(due_date);
CREATE INDEX IF NOT EXISTS idx_billing_deleted_at ON billing_records(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER update_billing_records_updated_at
  BEFORE UPDATE ON billing_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
