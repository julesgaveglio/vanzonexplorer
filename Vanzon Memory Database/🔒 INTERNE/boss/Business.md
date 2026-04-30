# Business — Vanzon Explorer

## Persona cible
- **Location van :** Couples 25-45 ans, premiers road-trippers, Pays Basque / cote atlantique
- **Formation VBA :** Particuliers 25-45 ans qui veulent un complement de revenus via la location de van amene — zero competence bricolage, cherchent un plan etape par etape

## Offre

### 1. Formation Van Business Academy (VBA) — LEVIER PRINCIPAL
- **Prix actuel :** 997 EUR (tarif lancement) → 1 497 EUR apres 10 ventes
- **Contenu :** 10 modules, ~60 videos sur Bunny.net Stream
- **Hebergement :** vanzonexplorer.com/dashboard/vba
- **Promesse :** apprendre a acheter, amenager et mettre en location un van — meme sans competence bricolage
- **Ventes a date :** 1 (avril 2026)
- **Tunnel :** Meta Ads → opt-in email → VSL 15min → call Calendly → closing → paiement Stripe
- **Media buyer :** Matteo (ami), budget 600 EUR/mois (~20 EUR/jour), 3 creatives A/B
- **Support client :** WhatsApp 1-to-1 avec Jules (pas de groupe)

**Strategie packs (apres validation) :**
- Pack Non-VASP : modules amenagement simple + business
- Pack VASP : formation complete 10 modules
- Pack Business Only : pour ceux qui ont deja un van
- Pack Business+ : Business + publication van sur vanzonexplorer.com + articles SEO locaux + campagne ads
- Full Pack : tout inclus
- Systeme affiliation / parrainage a mettre en place

### 2. Location de vans amenages (activite historique)
- 2 vans : Yoni (vert, L2H1) et Xalbat (blanc, L2H1), tous deux CTTE
- Plateformes : Yescapa (16% commission) + debut location directe
- Tarifs : 65 EUR (basse) / 75 EUR (moyenne) / 95 EUR (haute saison)
- Objectif flotte : 5-10 vans VASP a terme (necessite local + financement)

### 3. Marketplace (MVP — secondaire)
- Concept : plateforme proprietaires/locataires
- Statut : MVP-1 live, 0/5 proprietaires inscrits
- Priorite basse vs VBA

### 4. Services premium Business+ (futur)
- Publication du van eleve sur vanzonexplorer.com
- Articles SEO cibles marche local de l'eleve
- Campagne Meta Ads automatisee par van
- Acces au referencement Vanzon

## Produit/Service
- VBA : 10 modules video (en cours de refonte qualite)
  - M1 Presentation → M2 Sourcing → M3 Conception → M4 VASP L1H1 → M5 Travaux → M6 Electricite → M7 Homologation VASP → M8 Normes VASP → M9 Dossier VASP → M10 Business
  - 2 parcours : non-VASP (skip M4, M7-M9) et VASP (complet)
- Satisfaction : a evaluer (1er client en cours)
- Amelioration continue : ecoute retours eleves, ajout valeur, qualite video

## Finances
- **Revenue mensuel location :** ~400-750 EUR/mois (Yescapa, saisonnier)
- **VBA :** 1 vente a 997 EUR (avril 2026)
- **Couts fixes :** hebergement Vercel/Supabase/Sanity (gratuit), domaine (~15 EUR/an)
- **Couts variables :** Meta Ads 600 EUR/mois, agents IA (~25 EUR/mois)
- **Objectif investissement :** cash VBA → local (12 000 EUR/an) + vans supplementaires

## Marketing
- **SEO :** 3 articles/semaine automatises, ~100+ articles publies
- **Meta Ads :** campagne active avec Matteo, tunnel opt-in → VSL → call
- **Backlinks :** systeme automatise (5 emails/jour, 72+ prospects)
- **Reseaux sociaux :** faible investissement actuel
- **Email :** tunnel VBA uniquement (pas de newsletter)
- **Futur :** affiliation, parrainage, campagnes ads par van

## Equipe
- **Jules :** fondateur, dev, contenu, strategie, vente — TOUT
- **Mario :** 20% SAS, contenu VBA, peu actif, contrat non signe
- **Matteo :** media buyer externe (ami)
- **Futur :** 1 employe/DG terrain pour la partie physique

## Outils
- **Tech :** Next.js 14, Supabase, Sanity CMS, Clerk, Vercel, Bunny.net
- **IA :** Groq, Gemini, Claude Code, DataForSEO
- **Marketing :** Meta Ads, Calendly, Gmail API, Telegram
- **Video :** Bunny.net Stream (VBA), YouTube (location)

## Donnees dynamiques disponibles
- **Funnel VBA :** `/api/admin/funnel` — steps, conversions, UTM, revenue estime
- **GSC :** `/api/admin/gsc/data` — clicks, impressions, CTR, positions
- **SEO :** `/api/admin/seo/keywords` + overview — keywords, autorite, trafic
- **Backlinks :** table backlink_prospects — statuts outreach
- **Blog :** table article_queue — pipeline, scores SEO
- **CMO :** table cmo_reports — health score, actions
- **Couts :** `/api/admin/costs` — depenses par agent/service
- **Stripe :** webhooks — achats VBA
- **Profiles :** table profiles — membres VBA, club
