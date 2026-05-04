-- ============================================================================
-- VANZON FINANCES — Schema Supabase
-- Execute ce SQL dans Supabase Dashboard > SQL Editor
-- ============================================================================

-- ── Categories de depenses/revenus (hierarchiques) ──────────────────────────

CREATE TABLE IF NOT EXISTS finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  parent_id UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#64748b',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Transactions (depenses + revenus) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL, -- toujours positif, le type determine le sens
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  category_id UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
  entity TEXT NOT NULL DEFAULT 'vanzon' CHECK (entity IN ('vanzon', 'yoni', 'xalbat', 'vba', 'perso')),
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Listes de courses / achats prevus ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  entity TEXT DEFAULT 'vanzon' CHECK (entity IN ('vanzon', 'yoni', 'xalbat', 'vba', 'perso')),
  budget DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INT DEFAULT 1,
  estimated_price DECIMAL(10,2),
  actual_price DECIMAL(10,2),
  purchased BOOLEAN DEFAULT false,
  url TEXT,
  notes TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Index pour les requetes frequentes ──────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON finance_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_entity ON finance_transactions(entity);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_type ON finance_transactions(type);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_category ON finance_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_list ON shopping_items(list_id);

-- ── Categories par defaut ───────────────────────────────────────────────────

INSERT INTO finance_categories (name, type, icon, color, sort_order) VALUES
  -- Depenses
  ('Marketing', 'expense', '📢', '#f97316', 1),
  ('Meta Ads', 'expense', '📱', '#3b82f6', 2),
  ('Outils & SaaS', 'expense', '🛠️', '#8b5cf6', 3),
  ('Amenagement Van', 'expense', '🚐', '#22c55e', 4),
  ('Electricite Van', 'expense', '⚡', '#eab308', 5),
  ('Isolation Van', 'expense', '🧱', '#a855f7', 6),
  ('Accessoires Van', 'expense', '🔧', '#06b6d4', 7),
  ('Entretien Van', 'expense', '🔩', '#64748b', 8),
  ('Assurance', 'expense', '🛡️', '#ef4444', 9),
  ('Carburant', 'expense', '⛽', '#f59e0b', 10),
  ('Domaine & Hebergement', 'expense', '🌐', '#6366f1', 11),
  ('Agents IA', 'expense', '🤖', '#10b981', 12),
  ('Juridique', 'expense', '📜', '#78716c', 13),
  ('Divers', 'expense', '📦', '#94a3b8', 14),
  -- Revenus
  ('Location Van', 'income', '🏕️', '#22c55e', 20),
  ('Vente VBA', 'income', '🎓', '#f59e0b', 21),
  ('Consulting IA', 'income', '💻', '#6366f1', 22),
  ('Affiliation', 'income', '🤝', '#ec4899', 23),
  ('Autre Revenu', 'income', '💰', '#10b981', 24)
ON CONFLICT DO NOTHING;
