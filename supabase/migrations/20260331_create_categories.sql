-- Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  main_category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT true,
  is_income BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER,
  is_loan BOOLEAN NOT NULL DEFAULT false,
  loan_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, main_category, sub_category)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_main ON categories(main_category);
CREATE INDEX IF NOT EXISTS idx_categories_system ON categories(is_system);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view system categories" ON categories;
CREATE POLICY "Users can view system categories" ON categories
  FOR SELECT USING (is_system = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own categories" ON categories;
CREATE POLICY "Users can create their own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_system = false);

DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
CREATE POLICY "Users can update their own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id AND is_system = false)
  WITH CHECK (auth.uid() = user_id AND is_system = false);

DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;
CREATE POLICY "Users can delete their own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id AND is_system = false);

-- Create trigger
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inntekt
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Inntekt', 'Inntekt 1', true, true, 1),
  (NULL, 'Inntekt', 'Inntekt 2', true, true, 2),
  (NULL, 'Inntekt', 'Inntekt 3', true, true, 3),
  (NULL, 'Inntekt', 'Inntekt 4', true, true, 4),
  (NULL, 'Inntekt', 'Inntekt 5', true, true, 5)
ON CONFLICT (user_id, main_category, sub_category) DO NOTHING;

-- Bolig
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Bolig', 'Strøm', true, false, 10),
  (NULL, 'Bolig', 'Husholdningsartikler', true, false, 11),
  (NULL, 'Bolig', 'Internett', true, false, 12),
  (NULL, 'Bolig', 'Telefon', true, false, 13),
  (NULL, 'Bolig', 'Husleie/Boliglån', true, false, 14)
ON CONFLICT (user_id, main_category, sub_category) DO NOTHING;

-- Transport
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Transport', 'Bilforsikring', true, false, 20),
  (NULL, 'Transport', 'Billån', true, false, 21),
  (NULL, 'Transport', 'Drivstoff', true, false, 22),
  (NULL, 'Transport', 'Vedlikehold og Reparasjoner', true, false, 23),
  (NULL, 'Transport', 'Parkering/Lading', true, false, 24),
  (NULL, 'Transport', 'Kollektivtransport', true, false, 25),
  (NULL, 'Transport', 'Bompenger', true, false, 26)
ON CONFLICT (user_id, main_category, sub_category) DO NOTHING;

-- Mat og Servering
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Mat og Servering', 'Kafé', true, false, 30),
  (NULL, 'Mat og Servering', 'Dagligvarer', true, false, 31),
  (NULL, 'Mat og Servering', 'Kiosk', true, false, 32),
  (NULL, 'Mat og Servering', 'Lunsj', true, false, 33),
  (NULL, 'Mat og Servering', 'Restaurant/Takeaway', true, false, 34)
ON CONFLICT (user_id, main_category, sub_category) DO NOTHING;

-- Helse og Velvære
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Helse og Velvære', 'Coaching', true, false, 40),
  (NULL, 'Helse og Velvære', 'Tannpleie', true, false, 41),
  (NULL, 'Helse og Velvære', 'Legebesøk', true, false, 42),
  (NULL, 'Helse og Velvære', 'Treningsmedlemskap', true, false, 43),
  (NULL, 'Helse og Velvære', 'Medisiner', true, false, 44),
  (NULL, 'Helse og Velvære', 'Synstest/Briller', true, false, 45)
ON CONFLICT (user_id, main_category, sub_category) DO NOTHING;

-- Personlig Pleie
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Personlig Pleie', 'Frisør', true, false, 50),
  (NULL, 'Personlig Pleie', 'Personlig Hygiene', true, false, 51),
  (NULL, 'Personlig Pleie', 'Hudpleie', true, false, 52)
ON CONFLICT (user_id, main_category, sub_category) DO NOTHING;

-- Forsikring
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Forsikring', 'Helseforsikring', true, false, 60),
  (NULL, 'Forsikring', 'Innboforsikring', true, false, 61),
  (NULL, 'Forsikring', 'Livsforsikring', true, false, 62),
  (NULL, 'Forsikring', 'Andre Forsikringer', true, false, 63)
ON CONFLICT (user_id, main_category, sub_category) DO NOTHING;

-- Abonnement og Underholdning
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Abonnement og Underholdning', 'Arrangementer', true, false, 70),
  (NULL, 'Abonnement og Underholdning', 'Spill', true, false, 71),
  (NULL, 'Abonnement og Underholdning', 'Hobby 1', true, false, 72),
  (NULL, 'Abonnement og Underholdning', 'Hobby 2', true, false, 73),
  (NULL, 'Abonnement og Underholdning', 'Hobby 3', true, false, 74),
  (NULL, 'Abonnement og Underholdning', 'Magasin/Avis 1', true, false, 75),
  (NULL, 'Abonnement og Underholdning', 'Magasin/Avis 2', true, false, 76),
  (NULL, 'Abonnement og Underholdning', 'Magasin/Avis 3', true, false, 77),
  (NULL, 'Abonnement og Underholdning', 'Kino/Filmer', true, false, 78),
  (NULL, 'Abonnement og Underholdning', 'Abonnement 1', true, false, 79),
  (NULL, 'Abonnement og Underholdning', 'Abonnement 2', true, false, 80),
  (NULL, 'Abonnement og Underholdning', 'Abonnement 3', true, false, 81),
  (NULL, 'Abonnement og Underholdning', 'Abonnement 4', true, false, 82),
  (NULL, 'Abonnement og Underholdning', 'Abonnement 5', true, false, 83),
  (NULL, 'Abonnement og Underholdning', 'Abonnement 6', true, false, 84),
  (NULL, 'Abonnement og Underholdning', 'Abonnement 7', true, false, 85),
  (NULL, 'Abonnement og Underholdning', 'Abonnement 8', true, false, 86),
  (NULL, 'Abonnement og Underholdning', 'Abonnement 9', true, false, 87)
ON CONFLICT (user_id, main_category, sub_category) DO NOTHING;

-- Utdanning
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Utdanning', 'Bøker', true, false, 90),
  (NULL, 'Utdanning', 'Deen Relatert', true, false, 91),
  (NULL, 'Utdanning', 'Nettkurs', true, false, 92),
  (NULL, 'Utdanning', 'Skolemateriell', true, false, 93)
ON CONFLICT (user_id, main_category, sub_category) DO NOTHING;

-- Klær
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Klær', 'Tilbehør', true, false, 100),
  (NULL, 'Klær', 'Klær', true, false, 101),
  (NULL, 'Klær', 'Sko', true, false, 102),
  (NULL, 'Klær', 'Sportsutstyr', true, false, 103)
ON CONFLICT (user_id, main_category, sub_category) DO NOTHING;

-- Familie/Barn
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Familie/Barn', 'Aktiviteter', true, false, 110),
  (NULL, 'Familie/Barn', 'Klær', true, false, 111),
  (NULL, 'Familie/Barn', 'Barnehage', true, false, 112),
  (NULL, 'Familie/Barn', 'Mat', true, false, 113),
  (NULL, 'Familie/Barn', 'Leker og Underholdning', true, false, 114),
  (NULL, 'Familie/Barn', 'Ferie 2024', true, false, 115),
  (NULL, 'Familie/Barn', 'Ferie 2025', true, false, 116)
ON CONFLICT (user_id, main_category, sub_category) DO NOTHING;

-- Diverse
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Diverse', 'Bankgebyrer', true, false, 120),
  (NULL, 'Diverse', 'Veldedighet', true, false, 121),
  (NULL, 'Diverse', 'Gaver', true, false, 122),
  (NULL, 'Diverse', 'Rentekostnader', true, false, 123),
  (NULL, 'Diverse', 'Andre Uventede Kostnader', true, false, 124)
ON CONFLICT (user_id, main_category, sub_category) DO NOTHING;

-- Høyrente Gjeld
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, is_loan, loan_type, display_order) VALUES
  (NULL, 'Høyrente Gjeld', 'Lån 1', true, false, true, 'hi-pressure', 130),
  (NULL, 'Høyrente Gjeld', 'Lån 2', true, false, true, 'hi-pressure', 131),
  (NULL, 'Høyrente Gjeld', 'Lån 3', true, false, true, 'hi-pressure', 132),
  (NULL, 'Høyrente Gjeld', 'Lån 4', true, false, true, 'hi-pressure', 133),
  (NULL, 'Høyrente Gjeld', 'Lån 5', true, false, true, 'hi-pressure', 134)
ON CONFLICT (user_id, main_category, sub_category) DO NOTHING;

-- Lavrente Gjeld
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, is_loan, loan_type, display_order) VALUES
  (NULL, 'Lavrente Gjeld', 'Lån 1', true, false, true, 'lo-pressure', 140),
  (NULL, 'Lavrente Gjeld', 'Lån 2', true, false, true, 'lo-pressure', 141),
  (NULL, 'Lavrente Gjeld', 'Lån 3', true, false, true, 'lo-pressure', 142),
  (NULL, 'Lavrente Gjeld', 'Lån 4', true, false, true, 'lo-pressure', 143),
  (NULL, 'Lavrente Gjeld', 'Lån 5', true, false, true, 'lo-pressure', 144)
ON CONFLICT (user_id, main_category, sub_category) DO NOTHING;

-- Ingen Press Gjeld
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, is_loan, loan_type, display_order) VALUES
  (NULL, 'Ingen Press Gjeld', 'Lån 1', true, false, true, 'no-pressure', 150),
  (NULL, 'Ingen Press Gjeld', 'Lån 2', true, false, true, 'no-pressure', 151),
  (NULL, 'Ingen Press Gjeld', 'Lån 3', true, false, true, 'no-pressure', 152),
  (NULL, 'Ingen Press Gjeld', 'Lån 4', true, false, true, 'no-pressure', 153),
  (NULL, 'Ingen Press Gjeld', 'Lån 5', true, false, true, 'no-pressure', 154),
  (NULL, 'Ingen Press Gjeld', 'Lån 6', true, false, true, 'no-pressure', 155),
  (NULL, 'Ingen Press Gjeld', 'Lån 7', true, false, true, 'no-pressure', 156),
  (NULL, 'Ingen Press Gjeld', 'Lån 8', true, false, true, 'no-pressure', 157),
  (NULL, 'Ingen Press Gjeld', 'Lån 9', true, false, true, 'no-pressure', 158),
  (NULL, 'Ingen Press Gjeld', 'Lån 10', true, false, true, 'no-pressure', 159)
ON CONFLICT (user_id, main_category, sub_category) DO NOTHING;

-- Investering
INSERT INTO categories (user_id, main_category, sub_category, is_system, is_income, display_order) VALUES
  (NULL, 'Investering', 'Investering 1', true, false, 170),
  (NULL, 'Investering', 'Investering 2', true, false, 171),
  (NULL, 'Investering', 'Investering 3', true, false, 172)
ON CONFLICT (user_id, main_category, sub_category) DO NOTHING;
