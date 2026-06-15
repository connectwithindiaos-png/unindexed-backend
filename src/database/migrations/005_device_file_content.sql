CREATE TABLE IF NOT EXISTS device_file_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES device_files(id) ON DELETE CASCADE,
  content BYTEA NOT NULL,
  mime_type VARCHAR(255) NOT NULL DEFAULT 'application/octet-stream',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_file_contents_file_id ON device_file_contents(file_id);
