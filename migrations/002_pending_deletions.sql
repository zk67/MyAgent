CREATE TABLE IF NOT EXISTS pending_deletions (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES app_sessions(id) ON DELETE CASCADE,
  event_ids JSONB NOT NULL,
  event_titles JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pending_deletions_session_idx ON pending_deletions(session_id);
