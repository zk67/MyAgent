CREATE TABLE IF NOT EXISTS login_rate_limits (
  ip_address TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL
);
