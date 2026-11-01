CREATE TABLE IF NOT EXISTS chat_rate_limits (
  session_id UUID PRIMARY KEY REFERENCES app_sessions(id) ON DELETE CASCADE,
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL
);
