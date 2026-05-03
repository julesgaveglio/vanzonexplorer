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

## Workflow recommandé quand l'utilisateur demande une VSL
1. Demander : niveau d'awareness de la cible ? (cold / problem aware / solution aware)
2. Demander : angle principal du hook ? (sinon proposer 3 angles)
3. Générer outline section par section avec timings
4. Écrire le script complet en respectant les timings
5. Auditer : checklist (hook < 30s, 1 chiffre/section, objections nommées, CTA unique)
6. Proposer 2 variantes pour le hook et l'offre

## Fichiers de référence à consulter
- `references/vsl-swipe-files.md` — exemples de hooks gagnants
- `references/objections-vba.md` — objections récurrentes des prospects van
- `references/proof-bank.md` — chiffres et stats Vanzon utilisables

## Intégration tunnel (technique)
Le script final est destiné à `/van-business-academy/presentation`. Events trackés dans `funnel_events` : vsl_view, vsl_25/50/75/100, booking_start. Une bonne VSL doit avoir un pic à 75% (l'offre) et un funnel propre vers booking_confirmed.
