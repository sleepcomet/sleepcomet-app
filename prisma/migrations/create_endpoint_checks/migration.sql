-- CreateTable
CREATE TABLE IF NOT EXISTS endpoint_checks (
  id SERIAL PRIMARY KEY,
  endpoint_id VARCHAR(255) NOT NULL,
  checked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_up BOOLEAN NOT NULL,
  response_time_ms FLOAT NOT NULL
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS idx_endpoint_checks_endpoint_id 
ON endpoint_checks(endpoint_id, checked_at DESC);
