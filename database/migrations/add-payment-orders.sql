BEGIN;

ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255);

CREATE TABLE IF NOT EXISTS payment_orders (
  id BIGSERIAL PRIMARY KEY,
  razorpay_order_id VARCHAR(255) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_id BIGINT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  receipt VARCHAR(255) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed')),
  razorpay_payment_id VARCHAR(255),
  razorpay_signature TEXT,
  webhook_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_file_id ON payment_orders(file_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at DESC);

COMMIT;
