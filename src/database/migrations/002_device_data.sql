CREATE TABLE IF NOT EXISTS device_sms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(255) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
  address VARCHAR(255) NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  date BIGINT NOT NULL DEFAULT 0,
  type INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(255) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
  name VARCHAR(512) NOT NULL DEFAULT '',
  phone_number VARCHAR(255) NOT NULL DEFAULT '',
  email VARCHAR(512) NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(255) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
  name VARCHAR(1024) NOT NULL DEFAULT '',
  path TEXT NOT NULL DEFAULT '',
  size BIGINT NOT NULL DEFAULT 0,
  last_modified BIGINT NOT NULL DEFAULT 0,
  is_directory BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_sms_device_id ON device_sms(device_id);
CREATE INDEX IF NOT EXISTS idx_device_contacts_device_id ON device_contacts(device_id);
CREATE INDEX IF NOT EXISTS idx_device_files_device_id ON device_files(device_id);
