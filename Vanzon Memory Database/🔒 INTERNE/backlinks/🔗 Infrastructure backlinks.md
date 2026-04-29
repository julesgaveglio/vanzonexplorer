---
name: Infrastructure backlinks automatisée
description: Système complet d'outreach backlinks : agent daily (5 emails/jour Mar-Ven 9h30), reply detection Gmail+Groq, follow-up J+4, 72 prospects diversifiés
type: project
---

Système backlinks automatisé déployé le 2026-04-04 :

- **Agent daily** (`scripts/agents/backlinks-daily-outreach.ts`) : 4 phases — reply detection (Gmail threads + Groq sentiment) → follow-up J+4 dans même thread → 5 nouveaux outreach/jour (email discovery + Groq email personnalisé + Gmail API) → label BACKLINKS + Telegram recap
- **Cron** : Mar-Ven 9h30 Paris (`.github/workflows/backlinks-daily-outreach.yml`)
- **Agent weekly** (`backlinks-weekly-agent.ts`) : découverte prospects Tavily, rotation 4 méthodes, score Groq ≥5
- **Gmail client enrichi** (`src/lib/gmail/client.ts`) : envoi, reply-in-thread, labels, lecture threads, headers
- **72 prospects** en DB au 2026-04-04 : 53 découverts, 17 contactés, 2 obtenus (cosyvans.fr, labelvanlife.com)
- **10 axes diversifiés** : surf/outdoor local, annuaires tourisme, presse locale (Sud-Ouest DA 80+), éco-tourisme, road trip blogs, camping/aires, institutionnels (CCI), campings, gîtes, mariage/EVJF
- **Tables Supabase** : `backlink_prospects`, `backlink_outreach` (avec gmail_message_id, gmail_thread_id, reply_body, reply_sentiment, follow_up_count), `backlink_scrape_sessions`

**Why:** L'indexation Google de Vanzon est freinée par un manque d'autorité de domaine. Les backlinks sont le levier principal pour améliorer le DA et accélérer l'indexation des 40+ articles blog.

**How to apply:** L'agent tourne automatiquement. Vérifier le Kanban `/admin/backlinks` pour suivre l'avancement. Les prospects score 9 (ur-bizia, en-pays-basque, sudouest.fr) sont contactés en priorité.

---

## Liens
- [[🔍 SEO — Infrastructure de trafic]]
