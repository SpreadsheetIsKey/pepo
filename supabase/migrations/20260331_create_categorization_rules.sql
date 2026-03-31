-- Create categorization_rules table
CREATE TABLE IF NOT EXISTS categorization_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Pattern matching
  pattern TEXT NOT NULL,
  pattern_type TEXT NOT NULL DEFAULT 'contains',
  case_sensitive BOOLEAN NOT NULL DEFAULT false,

  -- Category assignment
  main_category TEXT NOT NULL,
  sub_category TEXT NOT NULL,

  -- Rule metadata
  confidence DECIMAL(3, 2) NOT NULL DEFAULT 0.95,
  priority INTEGER NOT NULL DEFAULT 100,
  is_system BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Usage tracking
  match_count INTEGER NOT NULL DEFAULT 0,
  last_matched_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categorization_rules_user_id ON categorization_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_categorization_rules_priority ON categorization_rules(priority ASC);
CREATE INDEX IF NOT EXISTS idx_categorization_rules_active ON categorization_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_categorization_rules_system ON categorization_rules(is_system);

-- Enable RLS
ALTER TABLE categorization_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view system rules and their own" ON categorization_rules;
CREATE POLICY "Users can view system rules and their own" ON categorization_rules
  FOR SELECT USING (is_system = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own rules" ON categorization_rules;
CREATE POLICY "Users can create their own rules" ON categorization_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_system = false);

DROP POLICY IF EXISTS "Users can update their own rules" ON categorization_rules;
CREATE POLICY "Users can update their own rules" ON categorization_rules
  FOR UPDATE USING (auth.uid() = user_id AND is_system = false)
  WITH CHECK (auth.uid() = user_id AND is_system = false);

DROP POLICY IF EXISTS "Users can delete their own rules" ON categorization_rules;
CREATE POLICY "Users can delete their own rules" ON categorization_rules
  FOR DELETE USING (auth.uid() = user_id AND is_system = false);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_categorization_rules_updated_at ON categorization_rules;
CREATE TRIGGER update_categorization_rules_updated_at
  BEFORE UPDATE ON categorization_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment match count
CREATE OR REPLACE FUNCTION increment_rule_match_count(rule_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE categorization_rules
  SET match_count = match_count + 1,
      last_matched_at = NOW()
  WHERE id = rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed system rules for common Norwegian merchants

-- Mat og Servering - Dagligvarer
INSERT INTO categorization_rules (user_id, pattern, pattern_type, main_category, sub_category, confidence, priority) VALUES
  (NULL, 'REMA 1000', 'contains', 'Mat og Servering', 'Dagligvarer', 0.99, 10),
  (NULL, 'KIWI', 'contains', 'Mat og Servering', 'Dagligvarer', 0.99, 10),
  (NULL, 'COOP', 'contains', 'Mat og Servering', 'Dagligvarer', 0.99, 10),
  (NULL, 'MENY', 'contains', 'Mat og Servering', 'Dagligvarer', 0.99, 10),
  (NULL, 'BUNNPRIS', 'contains', 'Mat og Servering', 'Dagligvarer', 0.99, 10),
  (NULL, 'EXTRA', 'contains', 'Mat og Servering', 'Dagligvarer', 0.95, 10),
  (NULL, 'JOKER', 'contains', 'Mat og Servering', 'Dagligvarer', 0.99, 10),
  (NULL, 'SPAR', 'contains', 'Mat og Servering', 'Dagligvarer', 0.90, 10)
ON CONFLICT DO NOTHING;

-- Mat og Servering - Restaurant/Takeaway
INSERT INTO categorization_rules (user_id, pattern, pattern_type, main_category, sub_category, confidence, priority) VALUES
  (NULL, 'MCDONALD', 'contains', 'Mat og Servering', 'Restaurant/Takeaway', 0.99, 10),
  (NULL, 'BURGER KING', 'contains', 'Mat og Servering', 'Restaurant/Takeaway', 0.99, 10),
  (NULL, 'PIZZA', 'contains', 'Mat og Servering', 'Restaurant/Takeaway', 0.90, 20),
  (NULL, 'RESTAURANT', 'contains', 'Mat og Servering', 'Restaurant/Takeaway', 0.85, 30),
  (NULL, 'PEPPES', 'contains', 'Mat og Servering', 'Restaurant/Takeaway', 0.99, 10),
  (NULL, 'DOLLY DIMPLE', 'contains', 'Mat og Servering', 'Restaurant/Takeaway', 0.99, 10)
ON CONFLICT DO NOTHING;

-- Mat og Servering - Kafé
INSERT INTO categorization_rules (user_id, pattern, pattern_type, main_category, sub_category, confidence, priority) VALUES
  (NULL, 'STARBUCKS', 'contains', 'Mat og Servering', 'Kafé', 0.99, 10),
  (NULL, 'KAFFEBRENNERIET', 'contains', 'Mat og Servering', 'Kafé', 0.99, 10),
  (NULL, 'ESPRESSO HOUSE', 'contains', 'Mat og Servering', 'Kafé', 0.99, 10),
  (NULL, 'CAFÉ', 'contains', 'Mat og Servering', 'Kafé', 0.85, 20),
  (NULL, 'KAFÉ', 'contains', 'Mat og Servering', 'Kafé', 0.85, 20)
ON CONFLICT DO NOTHING;

-- Transport - Drivstoff
INSERT INTO categorization_rules (user_id, pattern, pattern_type, main_category, sub_category, confidence, priority) VALUES
  (NULL, 'CIRCLE K', 'contains', 'Transport', 'Drivstoff', 0.95, 10),
  (NULL, 'ESSO', 'contains', 'Transport', 'Drivstoff', 0.95, 10),
  (NULL, 'SHELL', 'contains', 'Transport', 'Drivstoff', 0.95, 10),
  (NULL, 'YX', 'contains', 'Transport', 'Drivstoff', 0.95, 10),
  (NULL, 'BENSIN', 'contains', 'Transport', 'Drivstoff', 0.90, 20),
  (NULL, 'DIESEL', 'contains', 'Transport', 'Drivstoff', 0.90, 20)
ON CONFLICT DO NOTHING;

-- Transport - Kollektivtransport
INSERT INTO categorization_rules (user_id, pattern, pattern_type, main_category, sub_category, confidence, priority) VALUES
  (NULL, 'RUTER', 'contains', 'Transport', 'Kollektivtransport', 0.99, 10),
  (NULL, 'SKYSS', 'contains', 'Transport', 'Kollektivtransport', 0.99, 10),
  (NULL, 'ATB', 'contains', 'Transport', 'Kollektivtransport', 0.99, 10),
  (NULL, 'VY', 'contains', 'Transport', 'Kollektivtransport', 0.99, 10),
  (NULL, 'NSB', 'contains', 'Transport', 'Kollektivtransport', 0.99, 10),
  (NULL, 'KOLUMBUS', 'contains', 'Transport', 'Kollektivtransport', 0.99, 10)
ON CONFLICT DO NOTHING;

-- Transport - Bompenger
INSERT INTO categorization_rules (user_id, pattern, pattern_type, main_category, sub_category, confidence, priority) VALUES
  (NULL, 'AUTOPASS', 'contains', 'Transport', 'Bompenger', 0.99, 10),
  (NULL, 'FJELLINJEN', 'contains', 'Transport', 'Bompenger', 0.99, 10),
  (NULL, 'BOMRING', 'contains', 'Transport', 'Bompenger', 0.99, 10)
ON CONFLICT DO NOTHING;

-- Abonnement og Underholdning - Streaming
INSERT INTO categorization_rules (user_id, pattern, pattern_type, main_category, sub_category, confidence, priority) VALUES
  (NULL, 'NETFLIX', 'contains', 'Abonnement og Underholdning', 'Abonnement 1', 0.99, 10),
  (NULL, 'SPOTIFY', 'contains', 'Abonnement og Underholdning', 'Abonnement 1', 0.99, 10),
  (NULL, 'HBO', 'contains', 'Abonnement og Underholdning', 'Abonnement 1', 0.99, 10),
  (NULL, 'DISNEY', 'contains', 'Abonnement og Underholdning', 'Abonnement 1', 0.99, 10),
  (NULL, 'VIAPLAY', 'contains', 'Abonnement og Underholdning', 'Abonnement 1', 0.99, 10)
ON CONFLICT DO NOTHING;

-- Klær
INSERT INTO categorization_rules (user_id, pattern, pattern_type, main_category, sub_category, confidence, priority) VALUES
  (NULL, 'H&M', 'contains', 'Klær', 'Klær', 0.99, 10),
  (NULL, 'ZARA', 'contains', 'Klær', 'Klær', 0.99, 10),
  (NULL, 'CUBUS', 'contains', 'Klær', 'Klær', 0.99, 10),
  (NULL, 'LINDEX', 'contains', 'Klær', 'Klær', 0.99, 10),
  (NULL, 'KappAhl', 'contains', 'Klær', 'Klær', 0.99, 10),
  (NULL, 'DRESSMANN', 'contains', 'Klær', 'Klær', 0.99, 10)
ON CONFLICT DO NOTHING;

-- Bolig - Strøm
INSERT INTO categorization_rules (user_id, pattern, pattern_type, main_category, sub_category, confidence, priority) VALUES
  (NULL, 'FJORDKRAFT', 'contains', 'Bolig', 'Strøm', 0.99, 10),
  (NULL, 'TIBBER', 'contains', 'Bolig', 'Strøm', 0.99, 10),
  (NULL, 'HAFSLUND', 'contains', 'Bolig', 'Strøm', 0.99, 10),
  (NULL, 'STRØM', 'contains', 'Bolig', 'Strøm', 0.85, 20)
ON CONFLICT DO NOTHING;

-- Helse og Velvære - Treningsmedlemskap
INSERT INTO categorization_rules (user_id, pattern, pattern_type, main_category, sub_category, confidence, priority) VALUES
  (NULL, 'SATS', 'contains', 'Helse og Velvære', 'Treningsmedlemskap', 0.99, 10),
  (NULL, 'EVO', 'contains', 'Helse og Velvære', 'Treningsmedlemskap', 0.99, 10),
  (NULL, 'FRESH FITNESS', 'contains', 'Helse og Velvære', 'Treningsmedlemskap', 0.99, 10),
  (NULL, 'ELIXIA', 'contains', 'Helse og Velvære', 'Treningsmedlemskap', 0.99, 10)
ON CONFLICT DO NOTHING;

-- Diverse - Bankgebyrer
INSERT INTO categorization_rules (user_id, pattern, pattern_type, main_category, sub_category, confidence, priority) VALUES
  (NULL, 'GEBYR', 'contains', 'Diverse', 'Bankgebyrer', 0.90, 10),
  (NULL, 'KORTAVGIFT', 'contains', 'Diverse', 'Bankgebyrer', 0.95, 10),
  (NULL, 'ÅRSAVGIFT', 'contains', 'Diverse', 'Bankgebyrer', 0.95, 10)
ON CONFLICT DO NOTHING;
