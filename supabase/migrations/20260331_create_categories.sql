-- Create categories table for transaction categorization
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system categories

  -- Category structure
  main_category TEXT NOT NULL,
  sub_category TEXT NOT NULL,

  -- Category metadata
  is_system BOOLEAN NOT NULL DEFAULT true, -- System-provided or user-created
  is_income BOOLEAN NOT NULL DEFAULT false, -- Is this an income category?
  display_order INTEGER, -- For sorting in UI

  -- Loan tracking (premium feature - future use)
  is_loan BOOLEAN NOT NULL DEFAULT false,
  loan_type TEXT, -- 'hi-pressure', 'lo-pressure', 'no-pressure'

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique categories per user (NULL user_id = system categories)
  UNIQUE(user_id, main_category, sub_category)
);

-- Indexes for performance
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_main ON categories(main_category);
CREATE INDEX idx_categories_system ON categories(is_system);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view system categories and their own custom categories
CREATE POLICY "Users can view system categories" ON categories
  FOR SELECT
  USING (is_system = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own categories" ON categories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can update their own categories" ON categories
  FOR UPDATE
  USING (auth.uid() = user_id AND is_system = false)
  WITH CHECK (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can delete their own categories" ON categories
  FOR DELETE
  USING (auth.uid() = user_id AND is_system = false);

-- Function to automatically update updated_at timestamp
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed system categories
-- Income
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Income', 'Income 1', true, true, 1),
  (NULL, 'Income', 'Income 2', true, true, 2),
  (NULL, 'Income', 'Income 3', true, true, 3),
  (NULL, 'Income', 'Income 4', true, true, 4),
  (NULL, 'Income', 'Income 5', true, true, 5);

-- Housing
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Housing', 'Electricity', true, false, 10),
  (NULL, 'Housing', 'Household Items', true, false, 11),
  (NULL, 'Housing', 'Internet', true, false, 12),
  (NULL, 'Housing', 'Phone', true, false, 13),
  (NULL, 'Housing', 'Rent/Mortgage', true, false, 14);

-- Transportation
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Transportation', 'Car Insurance', true, false, 20),
  (NULL, 'Transportation', 'Car Loan', true, false, 21),
  (NULL, 'Transportation', 'Fuel', true, false, 22),
  (NULL, 'Transportation', 'Maintenance and Repairs', true, false, 23),
  (NULL, 'Transportation', 'Parking/Charging', true, false, 24),
  (NULL, 'Transportation', 'Public Transport', true, false, 25),
  (NULL, 'Transportation', 'Tolls', true, false, 26);

-- Food and Dining
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Food and Dining', 'Cafes', true, false, 30),
  (NULL, 'Food and Dining', 'Groceries', true, false, 31),
  (NULL, 'Food and Dining', 'Kiosk', true, false, 32),
  (NULL, 'Food and Dining', 'Lunch', true, false, 33),
  (NULL, 'Food and Dining', 'Restaurants / Take Away', true, false, 34);

-- Health and Wellness
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Health and Wellness', 'Coaching', true, false, 40),
  (NULL, 'Health and Wellness', 'Dental Care', true, false, 41),
  (NULL, 'Health and Wellness', 'Doctor Visits', true, false, 42),
  (NULL, 'Health and Wellness', 'Gym Membership', true, false, 43),
  (NULL, 'Health and Wellness', 'Medications', true, false, 44),
  (NULL, 'Health and Wellness', 'Vision Care', true, false, 45);

-- Personal Care
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Personal Care', 'Haircuts', true, false, 50),
  (NULL, 'Personal Care', 'Personal Hygiene', true, false, 51),
  (NULL, 'Personal Care', 'Skincare', true, false, 52);

-- Insurance
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Insurance', 'Health Insurance', true, false, 60),
  (NULL, 'Insurance', 'Home Insurance', true, false, 61),
  (NULL, 'Insurance', 'Life Insurance', true, false, 62),
  (NULL, 'Insurance', 'Other Insurances', true, false, 63);

-- Subscriptions and Entertainment
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Subscriptions and Entertainment', 'Events', true, false, 70),
  (NULL, 'Subscriptions and Entertainment', 'Games', true, false, 71),
  (NULL, 'Subscriptions and Entertainment', 'Hobby 1', true, false, 72),
  (NULL, 'Subscriptions and Entertainment', 'Hobby 2', true, false, 73),
  (NULL, 'Subscriptions and Entertainment', 'Hobby 3', true, false, 74),
  (NULL, 'Subscriptions and Entertainment', 'Magazines/Newspaper 1', true, false, 75),
  (NULL, 'Subscriptions and Entertainment', 'Magazines/Newspaper 2', true, false, 76),
  (NULL, 'Subscriptions and Entertainment', 'Magazines/Newspaper 3', true, false, 77),
  (NULL, 'Subscriptions and Entertainment', 'Movies', true, false, 78),
  (NULL, 'Subscriptions and Entertainment', 'Subscription 1', true, false, 79),
  (NULL, 'Subscriptions and Entertainment', 'Subscription 2', true, false, 80),
  (NULL, 'Subscriptions and Entertainment', 'Subscription 3', true, false, 81),
  (NULL, 'Subscriptions and Entertainment', 'Subscription 4', true, false, 82),
  (NULL, 'Subscriptions and Entertainment', 'Subscription 5', true, false, 83),
  (NULL, 'Subscriptions and Entertainment', 'Subscription 6', true, false, 84),
  (NULL, 'Subscriptions and Entertainment', 'Subscription 7', true, false, 85),
  (NULL, 'Subscriptions and Entertainment', 'Subscription 8', true, false, 86),
  (NULL, 'Subscriptions and Entertainment', 'Subscription 9', true, false, 87);

-- Education
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Education', 'Books', true, false, 90),
  (NULL, 'Education', 'Deen Related', true, false, 91),
  (NULL, 'Education', 'Online Courses', true, false, 92),
  (NULL, 'Education', 'Supplies', true, false, 93);

-- Clothing
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Clothing', 'Accessories', true, false, 100),
  (NULL, 'Clothing', 'Clothing', true, false, 101),
  (NULL, 'Clothing', 'Shoes', true, false, 102),
  (NULL, 'Clothing', 'Sports Clothing', true, false, 103);

-- Family/Child
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Family/Child', 'Activities', true, false, 110),
  (NULL, 'Family/Child', 'Clothing', true, false, 111),
  (NULL, 'Family/Child', 'Daycare', true, false, 112),
  (NULL, 'Family/Child', 'Food', true, false, 113),
  (NULL, 'Family/Child', 'Toys and Entertainment', true, false, 114),
  (NULL, 'Family/Child', 'Vacation 2024', true, false, 115),
  (NULL, 'Family/Child', 'Vacation 2025', true, false, 116);

-- Miscellaneous
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Miscellaneous', 'Bank Fees', true, false, 120),
  (NULL, 'Miscellaneous', 'Charitable Donations', true, false, 121),
  (NULL, 'Miscellaneous', 'Gifts', true, false, 122),
  (NULL, 'Miscellaneous', 'Interest Expenses', true, false, 123),
  (NULL, 'Miscellaneous', 'Other Unexpected Costs', true, false, 124);

-- Hi-Pressure Debt (Loans)
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, is_loan, loan_type, display_order) VALUES
  (NULL, 'Hi-Pressure Debt', 'Loan 1', true, false, true, 'hi-pressure', 130),
  (NULL, 'Hi-Pressure Debt', 'Loan 2', true, false, true, 'hi-pressure', 131),
  (NULL, 'Hi-Pressure Debt', 'Loan 3', true, false, true, 'hi-pressure', 132),
  (NULL, 'Hi-Pressure Debt', 'Loan 4', true, false, true, 'hi-pressure', 133),
  (NULL, 'Hi-Pressure Debt', 'Loan 5', true, false, true, 'hi-pressure', 134);

-- Lo-Pressure Debt (Loans)
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, is_loan, loan_type, display_order) VALUES
  (NULL, 'Lo-Pressure Debt', 'Loan 1', true, false, true, 'lo-pressure', 140),
  (NULL, 'Lo-Pressure Debt', 'Loan 2', true, false, true, 'lo-pressure', 141),
  (NULL, 'Lo-Pressure Debt', 'Loan 3', true, false, true, 'lo-pressure', 142),
  (NULL, 'Lo-Pressure Debt', 'Loan 4', true, false, true, 'lo-pressure', 143),
  (NULL, 'Lo-Pressure Debt', 'Loan 5', true, false, true, 'lo-pressure', 144);

-- No-Pressure Debt (Loans to friends/family)
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, is_loan, loan_type, display_order) VALUES
  (NULL, 'No-Pressure Debt', 'Loan 1', true, false, true, 'no-pressure', 150),
  (NULL, 'No-Pressure Debt', 'Loan 2', true, false, true, 'no-pressure', 151),
  (NULL, 'No-Pressure Debt', 'Loan 3', true, false, true, 'no-pressure', 152),
  (NULL, 'No-Pressure Debt', 'Loan 4', true, false, true, 'no-pressure', 153),
  (NULL, 'No-Pressure Debt', 'Loan 5', true, false, true, 'no-pressure', 154),
  (NULL, 'No-Pressure Debt', 'Loan 6', true, false, true, 'no-pressure', 155),
  (NULL, 'No-Pressure Debt', 'Loan 7', true, false, true, 'no-pressure', 156),
  (NULL, 'No-Pressure Debt', 'Loan 8', true, false, true, 'no-pressure', 157),
  (NULL, 'No-Pressure Debt', 'Loan 9', true, false, true, 'no-pressure', 158),
  (NULL, 'No-Pressure Debt', 'Loan 10', true, false, true, 'no-pressure', 159);

-- Investing
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Investing', 'Investment 1', true, false, 170),
  (NULL, 'Investing', 'Investment 2', true, false, 171),
  (NULL, 'Investing', 'Investment 3', true, false, 172);

-- Comments for documentation
COMMENT ON TABLE categories IS 'Stores system and user-defined transaction categories';
COMMENT ON COLUMN categories.is_system IS 'True for system-provided categories, false for user-created (premium)';
COMMENT ON COLUMN categories.is_loan IS 'True for loan/debt categories (enables loan tracking premium feature)';
COMMENT ON COLUMN categories.loan_type IS 'hi-pressure, lo-pressure, or no-pressure debt classification';
