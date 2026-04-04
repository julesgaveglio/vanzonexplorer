# 🏪 Marketplace — Vision & MVP

## Vision

Ouvrir Vanzon Explorer à tous les propriétaires de vans aménagés en France.
Commission 8-10% vs 16% Yescapa = argument commercial fort si le trafic SEO suit.

---

## Modèle économique

- Commission 8-10% sur chaque réservation
- Calcul réaliste : 20 vans × 7j/mois × 80€ × 9% = **~1 008€/mois**
- 50 vans → ~2 500€/mois

---

## Stratégie d'amorçage (problème poule/œuf)

Pas d'exclusivité. Les propriétaires gardent Yescapa en parallèle.
Vanzon = canal supplémentaire, argument : "0% commission sur les réservations directes".

**Phase 1 :** Pays Basque uniquement
**Phase 2 :** Expansion nationale (Bretagne, Côte d'Azur, Alpes)

---

## Avantages compétitifs

1. Trafic SEO organique propre
2. Commission 2× moins chère que Yescapa
3. Communauté Le Club = premiers utilisateurs
4. IA intégrée (road trip, reco)
5. Spécialisation géo vs généralistes

---

## Plan MVP — ordre validé

### MVP-0 (semaines 1-2) — Validation
Landing "Proposer votre van" + formulaire Supabase.
Contact propriétaires manuel.
**Objectif : 5 propriétaires intéressés.**

### MVP-1 (semaines 3-6) — Première transaction
Pages van publiques + formulaire réservation + confirmation manuelle + virement/Stripe simple + contrat PDF.
**Objectif : 1 vraie transaction.**

### MVP-2 (semaines 7-14) — Semi-automatisation
Calendrier disponibilités + Stripe Connect + dashboard propriétaire + messagerie simple.

### Ne pas construire avant 10 réservations manuelles
- Assurance API (Wakam)
- DocuSign / signature électronique
- Messagerie temps réel
- Application mobile

---

## Points légaux non-négociables avant lancement

1. **Stripe Connect** — obligatoire pour collecter + reverser des paiements (agrément ACPR)
2. **Assurance** — clause propriétaire obligatoire (assurance "location à des tiers" ~300-500€/an)
3. **Déclaration fiscale** — collecter SIRET propriétaires (art. 242 bis CGI)
4. **CGU** — plateforme = intermédiaire, pas loueur. Faire relire par avocat (~500-1 000€)
