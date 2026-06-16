ALTER TABLE devices ADD COLUMN IF NOT EXISTS token_id UUID REFERENCES tokens(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_devices_token_id ON devices(token_id);
