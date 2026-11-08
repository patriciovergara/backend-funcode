BEGIN;

CREATE TABLE IF NOT EXISTS revoked_tokens (
    id BIGSERIAL PRIMARY KEY,
    jti VARCHAR(255) NOT NULL UNIQUE,
    user_id INTEGER,
    reason VARCHAR(50) NOT NULL DEFAULT 'logout',
    revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT revoked_tokens_reason_check
        CHECK (reason IN ('logout', 'security', 'admin'))
);

CREATE TABLE IF NOT EXISTS security_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(80) NOT NULL,
    email VARCHAR(254),
    ip VARCHAR(45),
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS revoked_tokens_jti_idx
    ON revoked_tokens (jti);

CREATE INDEX IF NOT EXISTS revoked_tokens_revoked_at_idx
    ON revoked_tokens (revoked_at DESC);

CREATE INDEX IF NOT EXISTS security_events_created_at_idx
    ON security_events (created_at DESC);

CREATE INDEX IF NOT EXISTS security_events_type_idx
    ON security_events (event_type);

COMMIT;
