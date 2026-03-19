-- API response cache table
-- Stores parsed ESPN API responses for quick retrieval and historical preservation.
--
-- Key format:
--   scoreboard:<sport>:<leagueId>:<YYYYMMDD>
--   standings:<sport>:<leagueId>
--   summary:<leagueId>:<eventId>

CREATE TABLE IF NOT EXISTS api_cache (
  key        TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Speed up cleanup queries (optional — table is small by primary key)
CREATE INDEX IF NOT EXISTS api_cache_fetched_at ON api_cache (fetched_at);

-- Row-level security: service_role bypasses RLS so server writes always work.
-- If you want to enable RLS, uncomment the lines below.
-- ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "service role full access" ON api_cache USING (true);
