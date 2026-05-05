-- Users table for PIN login
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pin TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Staff', 'Manager'))
);

-- Insert default users for testing
INSERT INTO users (name, pin, role) VALUES ('Admin Manager', '1234', 'Manager') ON CONFLICT DO NOTHING;
INSERT INTO users (name, pin, role) VALUES ('Cashier Youssef', '0000', 'Staff') ON CONFLICT DO NOTHING;

-- Cash Reports
CREATE TABLE IF NOT EXISTS cash_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  report_date DATE NOT NULL,
  staff_id UUID REFERENCES users(id),
  system_amount NUMERIC NOT NULL,
  actual_amount NUMERIC NOT NULL,
  difference NUMERIC NOT NULL,
  breakdown_mad JSONB DEFAULT '{}'::jsonb,
  breakdown_usd JSONB DEFAULT '{}'::jsonb,
  breakdown_eur JSONB DEFAULT '{}'::jsonb,
  system_report_image_url TEXT
);

-- TPE Reports
CREATE TABLE IF NOT EXISTS tpe_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  report_date DATE NOT NULL,
  staff_id UUID REFERENCES users(id),
  system_amount NUMERIC NOT NULL,
  actual_amount NUMERIC NOT NULL,
  tips NUMERIC NOT NULL DEFAULT 0,
  difference NUMERIC NOT NULL,
  system_report_image_url TEXT
);

-- Gratuite Reports
CREATE TABLE IF NOT EXISTS gratuite_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  report_date DATE NOT NULL,
  staff_id UUID REFERENCES users(id),
  table_info TEXT NOT NULL,
  justification TEXT NOT NULL,
  proof_image_url TEXT
);

-- DP / PC Reports
CREATE TABLE IF NOT EXISTS dp_pc_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  report_date DATE NOT NULL,
  staff_id UUID REFERENCES users(id),
  tent_number TEXT NOT NULL,
  board_type TEXT NOT NULL CHECK (board_type IN ('Demi Pension', 'Pension Complete')),
  proof_image_url TEXT
);

-- Receipts table
CREATE TABLE IF NOT EXISTS receipt_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  report_date DATE NOT NULL,
  staff_id UUID REFERENCES users(id),
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL
);

-- Enable RLS (Row Level Security) - leaving mostly open for simplicity in this MVP but structured properly
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpe_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE gratuite_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE dp_pc_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all actions for everyone" ON users FOR ALL USING (true);
CREATE POLICY "Allow all actions for everyone" ON cash_reports FOR ALL USING (true);
CREATE POLICY "Allow all actions for everyone" ON tpe_reports FOR ALL USING (true);
CREATE POLICY "Allow all actions for everyone" ON gratuite_reports FOR ALL USING (true);
CREATE POLICY "Allow all actions for everyone" ON dp_pc_reports FOR ALL USING (true);
CREATE POLICY "Allow all actions for everyone" ON receipt_images FOR ALL USING (true);

-- Create a public bucket for receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to the bucket
CREATE POLICY "Public Access to receipts bucket" 
ON storage.objects FOR ALL 
USING (bucket_id = 'receipts');

-- Action Logs
CREATE TABLE IF NOT EXISTS action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES users(id),
  action_type TEXT NOT NULL,
  description TEXT
);

-- Pin Change Requests
CREATE TABLE IF NOT EXISTS pin_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES users(id),
  new_pin TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all actions for everyone" ON action_logs FOR ALL USING (true);
CREATE POLICY "Allow all actions for everyone" ON pin_change_requests FOR ALL USING (true);
