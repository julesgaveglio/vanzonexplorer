---
name: vsl-creation
description: Use this skill whenever the user wants to write, structure, audit, or improve a Video Sales Letter (VSL) — especially for the Van Business Academy tunnel (/van-business-academy/presentation). Triggers: "écris une VSL", "améliore le script", "le hook ne convertit pas", "audit ma VSL", "réécris la partie offre", "génère un script de 12 min", "travaille la partie émotion/trust/closing". Also triggers for VSL hooks, story bridges, agitation, offer stacks, objection handling, urgency/scarcity, CTAs, and post-VSL email sequences. Do NOT use for generic blog articles, SEO content, or short-form ads (use blog-writer-agent or copywriting prompts instead).
---

# VSL Creation Skill — Van Business Academy

## Contexte business
Cible : aspirants entrepreneurs van life voulant lancer leur business van (location, conciergerie, contenu).
Offre : VBA — formation A→Z, 997€ (lancement, passe à 1497€ après 10 ventes).
Tunnel : Meta Ads → opt-in → VSL 12 min → call Calendly → closing → Stripe.
Voix de marque : direct, terrain, anti-bullshit, preuves chiffrées, vocabulaire van life (PL, CG, Yescapa, Wikicampers, ROI, taux d'occupation).

## Structure obligatoire d'une VSL 12 min (≈ 1800-2000 mots)

1. **Hook (0-30s)** — promesse spécifique + curiosity gap. Pattern : "Si tu [situation], dans les 12 prochaines minutes je vais te montrer comment [résultat] sans [objection #1] ni [objection #2]."
2. **Crédibilité éclair (30s-1min)** — qui parle, pourquoi écouter. Stats Vanzon : flotte, CA, années, élèves.
3. **Problème (1-3min)** — agitation. Le "monde tel qu'il est" pour la cible. Douleurs concrètes (van qui dort, charges, peur de se lancer, échecs Yescapa solo).
4. **Bridge / Big Idea (3-5min)** — la révélation contre-intuitive. Pourquoi 90% se plantent. Ce que personne ne dit.
5. **Solution / Mécanisme unique (5-7min)** — la méthode VBA en 3-5 piliers nommés.
6. **Preuve (7-9min)** — case studies, témoignages, screenshots résultats élèves, chiffres flotte Vanzon.
7. **Offre (9-10:30min)** — stack : formation + bonus + accompagnement. Ancrage prix (valeur 4000€+) puis 997€.
8. **Risque inversé + urgence (10:30-11:30)** — garantie, scarcity réelle (10 places lancement), pourquoi maintenant.
9. **CTA (11:30-12min)** — un seul : "Réserve ton appel diagnostic offert" → Calendly. Récap bonus si pas de mouvement.

## Triggers émotionnels à activer (Cialdini + Schwartz)
- **Identity shift** : "tu n'es pas un loueur, tu es un opérateur"
- **Loss aversion** : ce que coûte chaque mois sans agir
- **Social proof** : élèves, flotte, CA
- **Authority** : Jules + Vanzon
- **Specificity** : chiffres précis (47%, 2 340€, 3 vans)
- **Future pacing** : "dans 6 mois, ton van génère X pendant que tu..."

## Règles non-négociables
- JAMAIS de hype creux ("change ta vie", "secret millionnaire")
- TOUJOURS un chiffre vérifiable par paragraphe clé
- TOUJOURS nommer l'objection avant qu'elle naisse ("tu vas me dire que...")
- UN SEUL CTA en fin (l'appel Calendly)
- Phrases courtes. Lecture orale. Tester en lisant à voix haute.
- Vocabulaire van life précis, pas de jargon marketing US plaqué

## Frameworks de référence
- **PASTOR** (Problem, Amplify, Story, Transform, Offer, Response)
- **AIDA** pour les blocs courts
- **PAS** pour les sections agitation
- **Eugene Schwartz — Awareness levels** : adapter selon trafic Meta Ads (most cible = "problem aware")

## Checklist d'audit (scoring obligatoire avant livraison)

Avant de livrer une VSL, scorer chaque critère sur 2 points (0 = absent, 1 = partiel, 2 = solide). Score minimum acceptable : 26/34. En dessous, réécrire les sections faibles.

| # | Critère | Score |
|---|---|---|
| 1 | Hook < 30s lu à voix haute, promesse spécifique mesurable | /2 |
| 2 | Crédibilité posée en 1 min max avec 1 chiffre vérifiable | /2 |
| 3 | Problème agité avec 3 douleurs concrètes nommées | /2 |
| 4 | Big Idea contre-intuitive explicitée (le "ah oui c'est vrai") | /2 |
| 5 | Mécanisme unique nommé en 3-5 piliers labellisés | /2 |
| 6 | Au moins 2 preuves chiffrées + 1 témoignage nominatif | /2 |
| 7 | Offre stackée avec ancrage prix puis 997€ | /2 |
| 8 | Au moins 3 objections nommées avant qu'elles naissent | /2 |
| 9 | Garantie + scarcity réelle (pas inventée) | /2 |
| 10 | UN SEUL CTA final, formulé verbe d'action | /2 |
| 11 | Phrases courtes (< 20 mots majoritairement), test lecture orale | /2 |
| 12 | Vocabulaire van life précis (pas de marketing US plaqué) | /2 |
| 13 | Future pacing présent (le "dans 6 mois...") | /2 |
| 14 | Identity shift activé (loueur → opérateur) | /2 |
| 15 | Aucun mot creux (révolutionnaire, secret, miracle, transformer ta vie) | /2 |
| 16 | Cohérence ton de marque Vanzon (direct, terrain, anti-bullshit) | /2 |
| 17 | Timings respectés (±15s par section) | /2 |

**Format de livraison obligatoire** : script complet + tableau de scoring rempli + 2 variantes de hook + 2 variantes d'offre.

## Workflow opérationnel

### Si tâche = créer une VSL from scratch
1. Demander niveau d'awareness cible (cold / problem / solution aware)
2. Demander angle hook ou en proposer 3
3. Outline section par section avec timings
4. Script complet
5. Audit checklist scorée
6. 2 variantes hook + 2 variantes offre

### Si tâche = améliorer une VSL existante (cas le plus fréquent)
1. **Toujours commencer par lire la data** : interroger Supabase `funnel_events` sur les 30 derniers jours :
   - Calculer taux de passage vsl_view → vsl_25 → vsl_50 → vsl_75 → vsl_100 → booking_start
   - Identifier le plus gros point de chute (>30% de drop entre deux étapes = critique)
2. Mapper le drop à une section du script (chute à 25% = problème hook/intro, chute à 50% = bridge faible, chute à 75% = offre/preuve faible, chute à 100% = CTA mou)
3. Réécrire UNIQUEMENT la section identifiée + 2 variantes A/B
4. Audit checklist sur la nouvelle version

### Si tâche = audit pur
Appliquer la checklist scorée, retourner score + top 3 faiblesses + recos par ordre d'impact.

## Fichiers de référence à consulter

- `references/vsl-swipe-files.md` — hooks/transitions/closes éprouvés
- `references/objections-vba.md` — objections récurrentes prospects van
- `references/proof-bank.md` — chiffres et témoignages utilisables
- `references/voice-vanzon.md` — calibration ton de marque (LIRE EN PREMIER avant toute écriture)
- `references/post-vsl-sequence.md` — séquence email post-VSL associée

**Ordre de lecture obligatoire avant d'écrire** : voice-vanzon.md → proof-bank.md → objections-vba.md → swipe-files.md.

## Intégration tunnel (technique)
Le script final est destiné à `/van-business-academy/presentation`. Events trackés dans `funnel_events` : vsl_view, vsl_25/50/75/100, booking_start. Une bonne VSL doit avoir un pic à 75% (l'offre) et un funnel propre vers booking_confirmed.
