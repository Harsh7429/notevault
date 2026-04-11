BEGIN;

ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS receipt_emailed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS login_otps (
  id BIGSERIAL PRIMARY KEY,
  challenge_id UUID NOT NULL UNIQUE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts_remaining INTEGER NOT NULL DEFAULT 5 CHECK (attempts_remaining >= 0),
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registration_otps (
  id BIGSERIAL PRIMARY KEY,
  challenge_id UUID NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts_remaining INTEGER NOT NULL DEFAULT 5 CHECK (attempts_remaining >= 0),
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_receipt_emailed_at ON purchases(receipt_emailed_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_otps_user_id ON login_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_login_otps_challenge_id ON login_otps(challenge_id);
CREATE INDEX IF NOT EXISTS idx_login_otps_expires_at ON login_otps(expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_registration_otps_email ON registration_otps(email);
CREATE INDEX IF NOT EXISTS idx_registration_otps_challenge_id ON registration_otps(challenge_id);
CREATE INDEX IF NOT EXISTS idx_registration_otps_expires_at ON registration_otps(expires_at DESC);

COMMIT;
