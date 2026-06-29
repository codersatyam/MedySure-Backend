-- Migration: 006_create_demo_requests
-- Description: Public "request a demo" submissions (name, email, phone).

CREATE TABLE IF NOT EXISTS demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_no VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'new',   -- new | contacted | closed
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
