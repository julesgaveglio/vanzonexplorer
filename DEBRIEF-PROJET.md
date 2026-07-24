# Débrief complet — dossier `vanzon-website-claude-code`

> Document de contexte généré le 2026-07-08. Objectif : qu'une IA (Claude Code ou autre) ou un humain qui découvre ce dossier comprenne immédiatement **ce qu'il contient réellement** — les projets, le business, les automatisations, les données — sans avoir à tout redécouvrir en explorant les fichiers un par un.
>
> Ce document ne remplace pas `CLAUDE.md` (instructions techniques pour Claude Code) ni la `Vanzon Memory Database` (source de vérité métier détaillée) — il sert de **carte d'orientation** qui relie tout ça entre eux, y compris des éléments non documentés ailleurs.

---

## 0. Résumé exécutif — en 30 secondes

Ce dossier contient **le monorepo complet d'une entreprise réelle, Vanzon Explorer** (SAS française, Pays Basque, location de vans aménagés + formation en ligne), plus **un second projet commercial distinct hébergé dans le même code** (Sigma Factory, investissement immobilier — voir section 3), plus une **vingtaine d'agents IA autonomes** qui font tourner le marketing, le SEO et le contenu de l'entreprise en continu, plus une **base de connaissance métier complète** (Vanzon Memory Database) qui sert de mémoire longue à l'assistant IA (Boss) qui aide le fondateur à piloter son business au quotidien.

Ce n'est pas qu'un site vitrine : c'est l'infrastructure technique **et** business complète d'une petite entreprise solo-fondée, où le code, les données, les automatisations IA et la documentation métier sont volontairement co-localisés pour qu'un assistant IA (Claude Code) puisse agir comme un collaborateur à part entière — développeur, marketeur, comptable et COO à la fois.

**État réel du business (mai-juin 2026, d'après la Memory Database)** : 1 seule vente de formation à ce jour (997€), location de 2 vans générant ~400-750€/mois, blog SEO en pause en attendant l'indexation Google. L'entreprise est en phase de recherche de product-market fit, pas encore rentable au sens plein.

---

## 1. Qui est derrière ce projet

**Jules Gaveglio**, 26 ans, fondateur et président à 80% de **Vanzon Explorer SAS** (SIREN 943 719 724, RCS Bayonne, immatriculée le 28/04/2025, siège à Cambo-les-Bains, Pays Basque). Développeur autodidacte (Next.js/Supabase/Sanity/automatisation IA), grandi au Pays Basque, ancien freelance en automatisation/IA. Sa mère est décédée d'un cancer en 2017 ; un tour du monde de 14 pays en 2023-2024 en hommage a été le déclic entrepreneurial. Objectif personnel affiché : expatriation en Thaïlande fin 2027/2028, financée par un objectif business de **10 000€/mois** de revenus.

**Mario**, associé à 20% du capital (**contrat SAS non signé** — risque juridique identifié en interne), pilote la vente/funnel de la formation. Il possède sa propre entreprise, **SigmaFactory.fr**, spécialisée en investissement immobilier — dont les difficultés actuelles retardent plusieurs chantiers Vanzon (expansion de flotte notamment). **C'est cette même entreprise Sigma Factory dont le tunnel de vente vit techniquement dans ce repo** (voir section 3) — Jules développe et héberge probablement l'infrastructure marketing de Mario en réutilisant son propre code.

Le projet est piloté en solo côté technique par Jules, avec l'aide de **Claude Code** utilisé de façon très poussée : agents personnalisés, skills métier (VSL, hooks), slash commands, et un assistant stratégique appelé "Boss" qui a accès en lecture à toute la mémoire business de l'entreprise.

---

## 2. Le produit principal : Vanzon Explorer (vanzonexplorer.com)

Site Next.js 14 (App Router, Server Components), déployé sur Vercel, avec trois couches de données (Sanity CMS pour l'éditorial, Supabase pour le transactionnel/opérationnel, Clerk pour l'auth). Le site sert **trois activités commerciales imbriquées** :

### 2.1 Location de vans aménagés (activité historique)
Deux vans réels en location : **Yoni** (Renault Trafic vert, 2016) et **Xalbat** (Renault Trafic blanc) — tous deux homologués **CTTE, pas VASP** (point de vigilance récurrent dans la documentation interne). Loués sur les plateformes **Yescapa** (commission 16%) et **Wikicampers**, avec point de départ à Cambo-les-Bains. Tarifs : 65€/nuit (basse saison) à 95€/nuit (haute saison). Revenu réel : 5 000-9 000€/an par van, taux d'occupation ~7 jours/mois. Le site (`/location/[ville]` : Biarritz, Hossegor, Bayonne, Saint-Jean-de-Luz, week-end, forêt d'Irati) n'est **pas un moteur de réservation** — c'est une couche d'acquisition SEO qui redirige vers Yescapa/Wikicampers, qui gèrent l'assurance et le paiement.

Une page `/achat` permet aussi la **revente directe** de Yoni et Xalbat (23 500€ pièce), issus de la flotte de location.

### 2.2 Formation en ligne — Van Business Academy (VBA), le pari stratégique principal
`/dashboard/vba` (accès élève) et `/van-business-academy/*` (tunnel de vente public). Formation vidéo (Bunny.net Stream) : **11 modules, 120+ vidéos, 17h+ de contenu**, enseignant comment acheter un van d'occasion, l'aménager, l'homologuer VASP, le louer et le revendre avec plus-value. Prix : **997€** (lancement, jusqu'à juillet 2026 ou 10 ventes) → **1 497€** ensuite.

Tunnel de vente complet : Meta Ads (media buyer externe, Matteo) → page d'opt-in → VSL (Video Sales Letter, 12 min) → réservation d'appel Calendly → closing téléphonique manuel par Jules/Mario → paiement Stripe (1x ou 4x). **À ce jour (données internes mai 2026) : une seule vente réalisée** (Amine, 997€, fin avril 2026). Le funnel sur 30 jours a montré un goulot majeur : 68% des personnes qui s'inscrivent ne regardent jamais la VSL, et le "Boss" (agent IA stratégique) diagnostique le vrai problème comme **humain et commercial** (peur du closing chez Jules) plus que technique — alors que Jules a une tendance documentée à sur-investir dans le développement au détriment de la vente directe.

### 2.3 Marketplace de propriétaires de vans (`/proprietaire`) — stade très précoce
Landing page de pré-inscription pour des propriétaires tiers voulant louer leur van via la future marketplace Vanzon (commission cible 8-10% contre 16% chez Yescapa). Au stade de simple liste d'attente (table `van_owner_leads`) — 0 propriétaire inscrit à la dernière mesure interne. Vision long terme documentée : transformer Vanzon en "plateforme vanlife du Pays Basque" plutôt qu'un simple loueur.

### 2.4 Le Club Vanzon (programme de deals partenaires)
`/admin/club` — back-office de gestion de marques partenaires et produits en deals exclusifs pour les élèves/clients (distinct de la prospection de marques pour backlinks). Infrastructure présente (tables `brands`, `products`, `categories`, `partnership_requests`) mais la mention Club a été retirée du parcours homepage/SEO en mai 2026 (voir commits récents "suppression complète du Club").

### 2.5 Générateur de road trip IA (`/road-trip-personnalise`)
Outil gratuit de génération d'itinéraire personnalisé au Pays Basque (région, durée, style, budget → Tavily + Groq → email). Sert de **lead magnet** : capture des emails qui nourrissent aussi une base de Points d'Intérêt (POI) réutilisée pour générer automatiquement des articles de blog SEO (`road-trip-publisher-agent`, toutes les 4h).

---

## 3. Le second projet caché : Sigma Factory (investissement immobilier)

**Découverte importante non documentée dans CLAUDE.md** : le repo héberge un **second tunnel de vente entièrement distinct**, `(tunnel)/sigmafactory/*`, vendant une offre d'investissement immobilier locatif ("stratégie IDRH — solder 60 à 100% de son crédit immobilier en moins de 12 mois"). Rien à voir avec les vans, aucune mention de Vanzon dans le contenu visible par le visiteur.

Ce tunnel est un **clone technique** du tunnel VBA (même stack de composants, mêmes conventions de tracking) mais avec son propre branding, ses propres tables Supabase (préfixe `sigma_`), son propre back-office de media buying (`/sigma-ads`, login séparé `/sigma-login`) et **pas de paiement en ligne** — la vente se fait entièrement par téléphone après prise de rendez-vous, contrairement à VBA qui a un checkout Stripe intégré.

Recoupé avec la Memory Database : cette offre correspond très probablement à **SigmaFactory.fr, l'entreprise personnelle de Mario** (l'associé 20% de Vanzon), qui "pilote la vente/funnel" et a "un système déjà utilisé avec succès pour une formation immobilière" selon les notes internes de Jules. Autrement dit : **Jules développe et héberge, dans le repo de sa propre entreprise, l'infrastructure marketing du business personnel de son associé**, en réutilisant son propre code de tunnel de vente. Ce n'est mentionné nulle part dans CLAUDE.md ni dans le README.

---

## 4. Les automatisations IA (le vrai moteur opérationnel du projet)

Le projet ne tourne pas seulement sur des développeurs humains : une vingtaine d'**agents IA autonomes** (`scripts/agents/*.ts`, déclarés dans `scripts/agents/registry.json`, visibles à `/admin/agents`) exécutent en continu, sur des cron GitHub Actions ou n8n, une bonne partie du travail marketing/SEO/contenu :

- **Pipeline SEO/blog** (séquentiel) : recherche de mots-clés trimestrielle → construction de file d'articles mensuelle → rédaction (2 articles/semaine via Gemini, actuellement **en pause depuis le 3 mai 2026** en attendant l'indexation Google) → optimisation trimestrielle des articles sous-performants (via Search Console) → maillage interne mensuel algorithmique → stratégie de cocon sémantique (piliers/clusters) → renommage SEO des images.
- **Pipeline backlinks** : découverte hebdomadaire de prospects (Tavily + scoring Groq) → outreach quotidien automatisé (détection de réponses Gmail, relances, 5 nouveaux emails/jour) — **en pause également**.
- **Pipeline road trip** : génération de requêtes synthétiques → transformation en articles Sanity toutes les 4h → email de feedback à J+1.
- **Pipeline CMO** : rapports marketing hebdomadaires et audits 360° mensuels (health score 0-100) via Groq.
- **Sync opérationnelle** : réservations Yescapa/Wikicampers → Google Calendar (via n8n), transactions bancaires Qonto → Supabase/Airtable (catégorisation IA), factures reçues par email → Google Drive classé automatiquement (via n8n + Gemini Vision, workflow récemment corrigé).

En parallèle, une couche d'**agents "conseillers"** invocables à la demande via slash commands Claude Code (`agents/*.md`, distincts des scripts) : le plus important est **Boss** (`/boss`), un COO IA qui lit toute la Memory Database, interroge Supabase/GSC en temps réel, diagnostique le goulot d'étranglement business du moment selon une matrice Client×Offre×Trafic×Conversion, et invoque automatiquement le skill `vsl-creation` si un problème de conversion est détecté sur le tunnel VBA. D'autres agents couvrent le SEO (`seo-analyzer`), l'audit de contenu concurrentiel (`content-auditor` + `article-improver`), et la stratégie business brute et sans complaisance (`strategic-director`, `/strategie`).

Deux **skills Claude Code** encadrent la production de contenu marketing à fort enjeu : `hooks` (méthode CLAC pour écrire des accroches) et `vsl-creation` (framework complet de script de vente vidéo, checklist d'audit sur 34 points).

---

## 5. Le modèle de données — deux systèmes complémentaires

**Sanity CMS** porte le contenu éditorial versionné et affiché publiquement : fiches van (`van`), articles de blog (`article`), articles de road trip générés par IA (`roadTripArticle`, avec pont explicite vers Supabase via `sourceRequestId`), fiches lieux Pays Basque (`spotPaysBasque`), témoignages, médiathèque avec alt-text SEO obligatoire, et paramètres globaux du site.

**Supabase (Postgres)** porte tout le reste — le transactionnel et l'infrastructure des agents IA, avec plus de 40 tables regroupées en grands domaines : profils utilisateurs (migrés de Supabase Auth vers **Clerk** en cours de route), prospection de marques et de backlinks, pipeline road trip (requêtes, régions, templates, cache de POI), reporting CMO, outreach Facebook et Pinterest (automatisation quasi complète, posting Pinterest encore bridé par un compte en essai), file de production d'articles SEO, la formation VBA (modules/leçons/progression) et un système générique de sous-formations réutilisant les modules VBA (ex : formation "Homologation VASP" seule), tracking fiable côté serveur du tunnel de vente (`funnel_events`), emails, et une mémoire textuelle pour l'assistant Telegram de Jules (`vanzon_memory`, avec recherche plein-texte et synchronisation vers Obsidian).

La frontière entre "cœur produit" et "infrastructure agents IA" est volontairement poreuse : `road_trip_requests` et `article_queue` sont alimentées par de vrais utilisateurs mais traitées de bout en bout par des agents autonomes — c'est le nœud qui relie le site public à toute la couche d'automatisation.

---

## 6. La Vanzon Memory Database — la mémoire longue du business

Vault Obsidian (`Vanzon Memory Database/`) qui sert de **source unique de vérité métier**, lue par les agents IA (notamment Boss) avant d'agir. Deux zones :

**🌐 PUBLIC** — identité de marque (positionnement anti-"discours de peur", anti-aménagements bâclés, engagement écologique concret suite à la surfréquentation de la forêt d'Irati), histoire personnelle de Jules, fiches des vans, méthode et chiffres clés de la formation, anecdotes fondatrices (première nuit dans le van à l'Ursuya, première location à Lyon, incident du rétroviseur), stratégie et historique réseaux sociaux (0 reel automatisé publié à ce jour malgré une banque de 20 idées).

**🔒 INTERNE** — la partie la plus critique : le dossier **`boss/`** contient les fichiers Core (Profile, Business, Goal, Diagnosis, Actions, Journal, Common_Problems) qui documentent en détail l'état réel du business à un instant T — objectif chiffré (10 000€/mois en 6 mois), diagnostic du goulot d'étranglement actuel (conversion + produit, pas trafic), biais personnels identifiés de Jules (sur-investissement technique, peur de vendre), et le risque juridique explicite sur l'accord non-écrit avec Mario. S'y ajoutent la stratégie business complète, la vision produit long terme, les transcripts de closing calls (dont un call réel documenté avec un prospect non converti), un dossier legal (KBIS, points bloquants marketplace), de la veille concurrentielle (y compris la transcription intégrale d'une formation concurrente), et un journal quotidien.

---

## 7. La couche meta-tooling Claude Code

Le projet est configuré pour un usage très poussé de Claude Code comme collaborateur permanent : 8 slash commands custom (`/boss`, `/cmo`, `/cmo-weekly`, `/cmo-monthly`, `/strategie`, `/analyze-seo`, `/write-article`, `/create-agent`) qui chargent des prompts d'agents métier stockés dans `agents/*.md` (convention interne au projet, pas le mécanisme natif `.claude/agents/`). Un `.mcp.json` minimal connecte un serveur de contrôle de navigateur ; les connecteurs Airtable/Figma/Gmail/Google Calendar/Google Drive/Facebook Ads visibles dans l'environnement sont en réalité des connecteurs de compte Claude.ai au niveau utilisateur, pas de projet. Un `.superpowers/brainstorm/` contient l'historique de sessions de maquettage HTML interactif utilisées pendant la conception de features (wizard marketplace, CTA, navbar...).

---

## 8. Ce qu'il faut retenir pour agir sur ce projet

1. **Vanzon n'est pas (encore) rentable au sens plein** — la location couvre ses frais, la formation (le vrai levier de croissance visé) n'a fait qu'une vente. Toute recommandation produit doit garder en tête que le goulot actuel est la **conversion commerciale**, pas la technique ou le trafic.
2. **Le repo héberge deux entreprises** — Vanzon Explorer et, techniquement, l'infrastructure de Sigma Factory (business immobilier de Mario). Ne pas confondre les deux lors de modifications au tunnel/aux dashboards ads.
3. **Plusieurs pans du marketing sont volontairement en pause** (blog SEO, outreach backlinks) en attendant l'indexation Google suite à des refontes SEO récentes (voir mémoire `seo-csr-bailout-root-cause.md`).
4. **Le risque juridique le plus documenté** est l'absence de contrat écrit avec Mario sur la propriété intellectuelle des vidéos VBA et le partage de revenus.
5. **La documentation elle-même a plusieurs sources qu'il faut croiser** : `CLAUDE.md` (technique, orienté Claude Code), `Vanzon Memory Database` (business, mise à jour irrégulière — certains fichiers datent d'avril/mai 2026), et le code lui-même (source de vérité la plus à jour, notamment pour tout ce qui touche à Sigma Factory, non documenté ailleurs).
