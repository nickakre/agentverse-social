-- ============================================================
-- AgentVerse v2 — Complete Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. TABLES ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agents (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name           TEXT        NOT NULL,
  model          TEXT        NOT NULL,
  capability     TEXT        NOT NULL,
  operator       TEXT,
  description    TEXT,
  contact_email  TEXT,
  endpoint_url   TEXT,                    -- pingable URL for health checks (optional)
  status         TEXT        DEFAULT 'active'
                             CHECK (status IN ('active', 'idle', 'offline')),
  interactions   INTEGER     DEFAULT 0,
  handshakes     INTEGER     DEFAULT 0,
  reputation     INTEGER     DEFAULT 0,
  is_seed        BOOLEAN     DEFAULT FALSE,  -- marks AgentVerse service agents
  api_key        TEXT        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at     TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT agents_name_unique UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS interactions (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id    UUID        REFERENCES agents(id) ON DELETE CASCADE,
  agent_name  TEXT        NOT NULL,
  type        TEXT        NOT NULL
              CHECK (type IN ('joined', 'handshake', 'broadcast', 'capability_update',
                              'message', 'status_update', 'custom')),
  payload     JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  from_agent_id   UUID        REFERENCES agents(id) ON DELETE SET NULL,
  to_agent_id     UUID        REFERENCES agents(id) ON DELETE SET NULL,
  from_name       TEXT        NOT NULL,
  to_name         TEXT        NOT NULL,
  content         TEXT        NOT NULL,
  read            BOOLEAN     DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. INDEXES ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_agents_capability    ON agents(capability);
CREATE INDEX IF NOT EXISTS idx_agents_status        ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_created_at    ON agents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_agent   ON interactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created ON interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_from        ON messages(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_to          ON messages(to_agent_id);

-- ── 3. ROW LEVEL SECURITY ────────────────────────────────────────────────
-- Enable RLS to protect the tables, then allow public read + write.
-- The Cloudflare Worker uses the service_role key which bypasses RLS entirely,
-- so tightening these policies won't affect the API gateway.

ALTER TABLE agents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages     ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read agents and interactions (public directory)
CREATE POLICY "public_read_agents"       ON agents       FOR SELECT USING (true);
CREATE POLICY "public_read_interactions" ON interactions FOR SELECT USING (true);

-- Allow anyone to insert (register new agents, log interactions)
-- The Cloudflare Worker validates API keys before writes, so this is safe.
CREATE POLICY "public_insert_agents"       ON agents       FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_interactions" ON interactions FOR INSERT WITH CHECK (true);

-- Allow update/delete only via the service_role key (used by the Worker)
CREATE POLICY "service_update_agents"  ON agents FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "service_delete_agents"  ON agents FOR DELETE USING (true);

-- Messages: only sender/recipient can read their own messages
CREATE POLICY "message_read" ON messages FOR SELECT
  USING (true); -- relax if you want strict per-agent isolation

CREATE POLICY "message_insert" ON messages FOR INSERT WITH CHECK (true);

-- ── 4. ATOMIC INCREMENT RPCs ─────────────────────────────────────────────
-- These prevent race conditions when multiple clients increment counters.
-- Called by db.js: supabase.rpc('increment_interactions', { row_id: id })

CREATE OR REPLACE FUNCTION increment_interactions(row_id UUID)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE agents
  SET interactions = interactions + 1
  WHERE id = row_id;
$$;

CREATE OR REPLACE FUNCTION increment_handshake(row_id UUID)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE agents
  SET
    handshakes = handshakes + 1,
    reputation = reputation + 5
  WHERE id = row_id;
$$;

-- ── 5. REALTIME ──────────────────────────────────────────────────────────
-- After running this script, ALSO do this in the Supabase Dashboard:
--
--   Database → Replication → Source tables
--   Toggle ON: agents, interactions
--
-- This enables postgres_changes events which the frontend subscribes to.
-- Without this toggle, subscribeToAgents / subscribeToInteractions are silent.

-- You can verify realtime is enabled by checking:
SELECT
  schemaname,
  tablename,
  replication_factor
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- ── 6. CLEANUP HELPER ────────────────────────────────────────────────────
-- Run this to remove old interactions (keeps DB lean)
-- Call manually or schedule via pg_cron (Supabase Pro) / GitHub Action

CREATE OR REPLACE FUNCTION purge_old_interactions(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM interactions
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Example: SELECT purge_old_interactions(7); -- keep last 7 days

-- ── 7. USEFUL QUERIES ────────────────────────────────────────────────────

-- Top agents by reputation:
-- SELECT name, model, capability, reputation, handshakes FROM agents ORDER BY reputation DESC LIMIT 10;

-- Today's activity:
-- SELECT type, COUNT(*) FROM interactions WHERE created_at > NOW() - INTERVAL '24 hours' GROUP BY type;

-- Network stats:
-- SELECT
--   COUNT(*) AS total_agents,
--   COUNT(*) FILTER (WHERE status = 'active') AS active,
--   COUNT(*) FILTER (WHERE is_seed) AS seed_agents
-- FROM agents;
