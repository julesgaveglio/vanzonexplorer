-- Table de suivi des appels DataForSEO
CREATE TABLE IF NOT EXISTS dfs_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL    DEFAULT now(),
  endpoint    TEXT        NOT NULL,
  label       TEXT        NOT NULL    DEFAULT '',
  cost_usd    NUMERIC(12,6)           DEFAULT 0,
  cost_eur    NUMERIC(12,6)           DEFAULT 0,
  status_code INT
);

ALTER TABLE dfs_logs ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (admin only)
CREATE POLICY "service_role_all" ON dfs_logs
  FOR ALL USING (auth.role() = 'service_role');
