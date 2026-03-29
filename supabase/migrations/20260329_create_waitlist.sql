-- Create waitlist table for landing page email signups
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- Add index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);

-- Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert their email (for signup)
CREATE POLICY "Anyone can sign up for waitlist" ON waitlist
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only authenticated users can view waitlist (for admin access later)
CREATE POLICY "Authenticated users can view waitlist" ON waitlist
  FOR SELECT
  USING (auth.role() = 'authenticated');
