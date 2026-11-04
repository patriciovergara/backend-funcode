CREATE TABLE IF NOT EXISTS service_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE RESTRICT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL,
  phone VARCHAR(30),
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_requests_post_id
  ON service_requests(post_id);

CREATE INDEX IF NOT EXISTS idx_service_requests_user_id
  ON service_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_service_requests_status
  ON service_requests(status);