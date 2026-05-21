-- ============================================================================
-- QONTO AI SYNC — Colonnes supplementaires pour finance_transactions
-- Execute ce SQL dans Supabase Dashboard > SQL Editor
-- ============================================================================

-- Qonto transaction ID pour deduplication
ALTER TABLE finance_transactions
  ADD COLUMN IF NOT EXISTS qonto_id TEXT UNIQUE;

-- Classification IA de la frequence
ALTER TABLE finance_transactions
  ADD COLUMN IF NOT EXISTS frequency_type TEXT
    CHECK (frequency_type IN (
      'subscription',
      'recurring_expense',
      'one_time_expense',
      'recurring_income',
      'one_time_income'
    ));

-- Nom du fournisseur/contrepartie Qonto
ALTER TABLE finance_transactions
  ADD COLUMN IF NOT EXISTS counterparty TEXT;

-- Moyen de paiement (carte, virement, prelevement)
ALTER TABLE finance_transactions
  ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- TVA
ALTER TABLE finance_transactions
  ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(10,2) DEFAULT 0;

-- Solde apres transaction
ALTER TABLE finance_transactions
  ADD COLUMN IF NOT EXISTS settled_balance DECIMAL(10,2);

-- Index pour dedup rapide et filtrage
CREATE INDEX IF NOT EXISTS idx_finance_transactions_qonto_id
  ON finance_transactions(qonto_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_frequency
  ON finance_transactions(frequency_type);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_counterparty
  ON finance_transactions(counterparty);
