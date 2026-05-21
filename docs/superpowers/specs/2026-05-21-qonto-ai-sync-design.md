# Qonto AI Sync — Webhook temps reel + categorisation Groq

**Date :** 21 mai 2026
**Statut :** Approuve
**Objectif :** Chaque transaction Qonto est automatiquement categorisee par IA et ecrite dans Airtable + Supabase

---

## Contexte actuel

### Route existante : `src/app/api/admin/sync-qonto/route.ts`

- **GET** : sync manuelle depuis admin (auth Clerk ou CRON_SECRET)
- **POST** : webhook Qonto (full sync a chaque event)
- **Destination** : Airtable uniquement (2 tables)
- **Categorisation** : keyword matching basique (`mapCategory()`)

### Airtable (source de verite actuelle)

Deux tables dans la base `app2FIBm3EPBmi9bL` :

**Table TRANSACTIONS (`tblD59sKLpf4h4eDs`)** — detail complet :
- Fournisseur, Libelle, Date, Montant TTC/HT, TVA, Taux TVA
- Type (Revenu/Depense), Moyen de paiement, Categorie Qonto, Sous-categorie
- Carte, Statut, Solde apres, Qonto ID, Notes

**Table FINANCES (`tblHD44V5TfUnEerY`)** — vue simplifiee :
- Date, Description, Montant (signe), Categorie, Sous-categorie
- Type (Entree/Sortie), Moyen de paiement, Notes

### Supabase `finance_transactions` (vide ou quasi-vide)

Schema actuel :
```sql
finance_transactions (
  id UUID PK,
  date DATE,
  description TEXT,
  amount DECIMAL(10,2),  -- toujours positif
  type TEXT ('expense'|'income'),
  category_id UUID FK -> finance_categories,
  entity TEXT ('vanzon'|'yoni'|'xalbat'|'vba'|'perso'),
  tags TEXT[],
  notes TEXT,
  is_recurring BOOLEAN,
  recurring_frequency TEXT ('weekly'|'monthly'|'quarterly'|'yearly'),
  receipt_url TEXT,
  created_at, updated_at
)
```

**Colonnes manquantes pour le sync Qonto :**
- `qonto_id` TEXT UNIQUE — deduplication
- `frequency_type` TEXT — classification IA
- `counterparty` TEXT — nom fournisseur original
- `payment_method` TEXT — carte/virement/prelevement
- `vat_amount` DECIMAL — TVA
- `settled_balance` DECIMAL — solde apres transaction

### Categories Supabase existantes (19 defaut)

**Depenses :** Marketing, Meta Ads, Outils & SaaS, Amenagement Van, Electricite Van, Isolation Van, Accessoires Van, Entretien Van, Assurance, Carburant, Domaine & Hebergement, Agents IA, Juridique, Divers

**Revenus :** Location Van, Vente VBA, Consulting IA, Affiliation, Autre Revenu

### Env vars disponibles

```
QONTO_API_SECRET        # Auth Qonto API
AIRTABLE_API_KEY        # Token Airtable
GROQ_API_KEY            # Groq LLM (+ _2, _3 en backup)
SUPABASE_SERVICE_ROLE_KEY  # Admin Supabase
```

---

## Design

### Architecture

```
Transaction Qonto (webhook POST)
      |
      v
/api/admin/sync-qonto [POST]
      |
      v
  Fetch 100 dernieres transactions Qonto API
      |
      v
  Dedup : filtrer celles deja dans Airtable (Qonto ID)
         + celles deja dans Supabase (qonto_id)
      |
      v
  Pour chaque nouvelle transaction :
      |
      v
  Groq llama-3.3-70b analyse :
    - category → match vers finance_categories.name
    - entity → vanzon|yoni|xalbat|vba|perso
    - frequency_type → subscription|recurring_expense|one_time_expense|recurring_income|one_time_income
      |
      v
  Double ecriture parallele :
    |                    |
    v                    v
  Airtable           Supabase
  (2 tables)         finance_transactions
    |                    |
    v                    v
  + champs :          + colonnes :
  Frequency Type      qonto_id
  Entity              frequency_type
  AI Category         counterparty
  AI Confidence       payment_method
                      vat_amount
                      settled_balance
```

### Classification `frequency_type`

| Valeur | Description | Detection |
|---|---|---|
| `subscription` | Abonnement mensuel/annuel | SaaS, Meta Ads, assurance, hosting |
| `recurring_expense` | Depense recurrente non-abo | Comptable, entretien regulier |
| `recurring_income` | Revenu recurrent | Loyers plateformes, abonnements clients |
| `one_time_expense` | Depense ponctuelle | Achat materiel, piece, formation |
| `one_time_income` | Revenu ponctuel | Vente van, consulting one-shot |

### Prompt Groq

```
Tu es un assistant comptable pour Vanzon Explorer (location/achat/formation van amenage).

Analyse cette transaction bancaire et retourne un JSON :

Transaction :
- Counterparty: {name}
- Amount: {amount} EUR
- Side: {debit/credit}
- Label: {label}
- Qonto category: {category}
- Qonto subcategory: {subcategory}

Categories disponibles (depenses) :
Marketing, Meta Ads, Outils & SaaS, Amenagement Van, Electricite Van,
Isolation Van, Accessoires Van, Entretien Van, Assurance, Carburant,
Domaine & Hebergement, Agents IA, Juridique, Divers

Categories disponibles (revenus) :
Location Van, Vente VBA, Consulting IA, Affiliation, Autre Revenu

Entites : vanzon (activite generale), yoni (van Yoni), xalbat (van Xalbat), vba (formation), perso (personnel Jules)

Regles metier :
- Meta/Facebook = toujours "Meta Ads" + entity "vba" (pub VBA)
- Yescapa/Wikicampers = "Location Van" + entity selon le van mentionne
- Vercel/Clerk/Supabase/Sanity = "Outils & SaaS" + entity "vanzon"
- Jules Gaveglio = "Apport" → categorise en "Autre Revenu" si credit
- Groq/OpenAI/Anthropic = "Agents IA" + entity "vanzon"

Retourne UNIQUEMENT ce JSON :
{
  "category": "nom exact de la categorie",
  "entity": "vanzon|yoni|xalbat|vba|perso",
  "frequency_type": "subscription|recurring_expense|one_time_expense|recurring_income|one_time_income",
  "confidence": 0.0-1.0
}
```

### Fallback

1. Si Groq echoue (timeout, rate limit) → `mapCategory()` keyword matching existant
2. Si Airtable echoue → on ecrit quand meme Supabase (et log l'erreur)
3. Si Supabase echoue → on ecrit quand meme Airtable (et log l'erreur)
4. Rotation cles Groq : GROQ_API_KEY → _2 → _3

### Migration Supabase

```sql
ALTER TABLE finance_transactions
  ADD COLUMN IF NOT EXISTS qonto_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS frequency_type TEXT
    CHECK (frequency_type IN (
      'subscription', 'recurring_expense', 'one_time_expense',
      'recurring_income', 'one_time_income'
    )),
  ADD COLUMN IF NOT EXISTS counterparty TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS settled_balance DECIMAL(10,2);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_qonto_id
  ON finance_transactions(qonto_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_frequency
  ON finance_transactions(frequency_type);
```

### Nouveaux champs Airtable (a ajouter manuellement)

Table FINANCES :
- `Frequency Type` (Single Select) : subscription, recurring_expense, one_time_expense, recurring_income, one_time_income
- `Entity` (Single Select) : vanzon, yoni, xalbat, vba, perso
- `AI Category` (Single Line Text) : categorie suggeree par Groq
- `AI Confidence` (Number, 0-1) : confiance du modele

Table TRANSACTIONS :
- `Frequency Type` (Single Select) : memes valeurs
- `Entity` (Single Select) : memes valeurs

### Fichiers modifies

| Fichier | Changement |
|---|---|
| `src/app/api/admin/sync-qonto/route.ts` | Refonte complete : + Groq + Supabase + frequency_type |
| `scripts/migrations/finance-qonto-sync.sql` | Nouveau : migration colonnes Supabase |

### Securite

- Le webhook POST Qonto n'a pas de signature HMAC (limitation Qonto API v2)
- On garde le full-sync approach (plus fiable que le parsing event-by-event)
- Le GET reste protege par Clerk cookie ou CRON_SECRET
