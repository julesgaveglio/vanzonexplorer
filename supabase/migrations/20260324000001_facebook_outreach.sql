-- supabase/migrations/20260324000001_facebook_outreach.sql

-- ── Templates (5 messages, stockés en BDD pour édition depuis dashboard) ─────
CREATE TABLE IF NOT EXISTS facebook_templates (
  id        INTEGER PRIMARY KEY CHECK (id BETWEEN 1 AND 5),
  label     TEXT NOT NULL,
  content   TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Groupes Facebook cibles ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS facebook_groups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name   TEXT NOT NULL,
  group_url    TEXT NOT NULL,
  member_count INTEGER,
  category     TEXT NOT NULL DEFAULT 'van aménagé FR',
  priority     INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ── Historique des posts envoyés ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS facebook_outreach_posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id            UUID NOT NULL REFERENCES facebook_groups(id) ON DELETE CASCADE,
  template_id         INTEGER NOT NULL REFERENCES facebook_templates(id),
  message_content     TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'sent'
                      CHECK (status IN ('sent', 'skipped', 'removed')),
  telegram_message_id INTEGER,
  posted_at           TIMESTAMPTZ DEFAULT now(),
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- ── Planning (posts à venir) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS facebook_outreach_schedule (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id       UUID NOT NULL REFERENCES facebook_groups(id) ON DELETE CASCADE,
  template_id    INTEGER NOT NULL REFERENCES facebook_templates(id),
  scheduled_for  DATE NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'sent', 'skipped', 'failed')),
  telegram_message_id INTEGER,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- ── RLS (admin only via service_role) ────────────────────────────────────────
ALTER TABLE facebook_templates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_groups            ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_outreach_posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_outreach_schedule ENABLE ROW LEVEL SECURITY;

-- ── Index ─────────────────────────────────────────────────────────────────────
CREATE INDEX idx_fb_schedule_date   ON facebook_outreach_schedule(scheduled_for);
CREATE INDEX idx_fb_schedule_status ON facebook_outreach_schedule(status);
CREATE INDEX idx_fb_posts_group     ON facebook_outreach_posts(group_id);
CREATE INDEX idx_fb_posts_date      ON facebook_outreach_posts(posted_at DESC);
CREATE INDEX idx_fb_groups_active   ON facebook_groups(is_active);

-- ── Seed templates ────────────────────────────────────────────────────────────
INSERT INTO facebook_templates (id, label, content) VALUES
(1, 'Problème résolu', 'Hey la commu 👋

Petite question : vous galérez aussi à planifier vos road trips en van ? Genre passer 3h sur Google Maps à checker les spots, les distances, ce qu''il y a à voir...

J''ai bidouillé un truc pour me simplifier la vie (gratuit) : tu balances ta destination + tes envies et boom, itinéraire complet par email.

Si certains veulent tester et me dire si c''est utile ou pas : https://www.vanzonexplorer.com/road-trip-personnalise?utm_source=facebook&utm_medium=organic&utm_campaign=groups_outreach&utm_content=template_1

(Cherche surtout des vrais retours pour améliorer le délire)'),
(2, 'Beta-testeurs', 'Salut à tous 🚐

Je développe actuellement un générateur d''itinéraires en van (IA + base de données de spots) et je cherche des beta-testeurs pour me dire ce qui manque.

L''idée : destination + durée + type de voyage → itinéraire personnalisé envoyé par email.

C''est 100% gratuit, j''ai juste besoin de retours honnêtes de vanlifers pour peaufiner l''outil.

Dispo ici si ça vous tente : https://www.vanzonexplorer.com/road-trip-personnalise?utm_source=facebook&utm_medium=organic&utm_campaign=groups_outreach&utm_content=template_2

Merci d''avance 🙏'),
(3, 'Side-project', 'Hello la team 👋

Vanlifer depuis 2 ans, j''en avais marre de perdre des heures à préparer mes road trips... du coup j''ai créé un petit outil perso que je viens de mettre en ligne.

Tu rentres ta destination, combien de temps tu as, ce que tu kiffs (nature, surf, culture, etc.) et l''outil te génère un itinéraire adapté. Tout est gratuit.

Si vous avez 2 minutes pour tester et me dire ce qui pourrait être amélioré, ce serait top : https://www.vanzonexplorer.com/road-trip-personnalise?utm_source=facebook&utm_medium=organic&utm_campaign=groups_outreach&utm_content=template_3

Vos retours sont précieux 🙏'),
(4, 'Question + solution', 'Question pour la commu 🤔

Comment vous préparez vos road trips ? Vous utilisez quoi comme outils/apps ?

J''ai développé un truc qui pourrait vous intéresser : un générateur d''itinéraires automatique selon votre destination/durée/envies. Gratuit et perso, ça me fait gagner pas mal de temps.

Je cherche des retours pour voir ce qui manque : https://www.vanzonexplorer.com/road-trip-personnalise?utm_source=facebook&utm_medium=organic&utm_campaign=groups_outreach&utm_content=template_4

D''ailleurs, vous utilisez quoi vous actuellement pour planifier ?'),
(5, 'Retour d''expérience', 'Petite découverte à partager 🚐

Après avoir passé un week-end entier à organiser mon dernier trip dans les Pyrénées (pour finalement louper les meilleurs spots 😅), je me suis dit qu''il fallait une meilleure solution.

J''ai monté un outil qui génère des road trips personnalisés en van : tu donnes ta destination + tes critères, et t''as un itinéraire complet en 1 minute par email.

C''est gratuit et en test, donc si vous voulez l''essayer et me dire ce qui manque : https://www.vanzonexplorer.com/road-trip-personnalise?utm_source=facebook&utm_medium=organic&utm_campaign=groups_outreach&utm_content=template_5

Cherche vraiment des retours constructifs 🙏');
