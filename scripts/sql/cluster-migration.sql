-- Migration pilier/cluster strategy
-- À exécuter dans Supabase Dashboard → SQL Editor

ALTER TABLE article_queue
  ADD COLUMN IF NOT EXISTS pillar_slug TEXT,
  ADD COLUMN IF NOT EXISTS cluster_topic TEXT;

-- Index pour les requêtes de groupement cluster
CREATE INDEX IF NOT EXISTS idx_article_queue_pillar
  ON article_queue(pillar_slug, cluster_topic)
  WHERE status = 'published';

-- Backfill automatique basique (à raffiner avec le cluster-updater-agent)
UPDATE article_queue SET pillar_slug = 'formation', cluster_topic = 'business-rentabilite'
  WHERE category IN ('Business Van') AND pillar_slug IS NULL;
UPDATE article_queue SET pillar_slug = 'achat', cluster_topic = 'amenagement-van'
  WHERE category = 'Aménagement Van' AND pillar_slug IS NULL;
UPDATE article_queue SET pillar_slug = 'achat', cluster_topic = 'achat-vente'
  WHERE category = 'Achat Van' AND pillar_slug IS NULL;
UPDATE article_queue SET pillar_slug = 'location', cluster_topic = 'tarifs-revenus'
  WHERE category = 'Location Van' AND pillar_slug IS NULL;
