-- Create transactions table for storing bank transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Transaction details
  transaction_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,

  -- Bank and account info
  bank_name TEXT, -- 'DNB', 'Nordea', 'Sparebank 1', etc.
  account_number TEXT,

  -- Categorization (will be populated by T-08)
  category TEXT,
  category_confidence DECIMAL(3, 2), -- 0.00 to 1.00

  -- Metadata for deduplication (T-06)
  file_name TEXT,
  file_uploaded_at TIMESTAMPTZ,
  row_hash TEXT, -- Hash of key fields for duplicate detection

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_row_hash ON transactions(row_hash);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own transactions
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE transactions IS 'Stores user bank transactions imported from CSV/PDF files';
COMMENT ON COLUMN transactions.row_hash IS 'MD5 hash of (user_id, date, amount, description) for duplicate detection';
COMMENT ON COLUMN transactions.category_confidence IS 'Confidence score from auto-categorization (0-1)';
