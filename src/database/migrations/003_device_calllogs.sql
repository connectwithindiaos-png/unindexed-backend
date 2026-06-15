CREATE TABLE IF NOT EXISTS device_call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    name TEXT,
    number TEXT NOT NULL DEFAULT '',
    type INTEGER NOT NULL DEFAULT 0,
    date BIGINT NOT NULL DEFAULT 0,
    duration BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_call_logs_device_id ON device_call_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_device_call_logs_date ON device_call_logs(date DESC);
