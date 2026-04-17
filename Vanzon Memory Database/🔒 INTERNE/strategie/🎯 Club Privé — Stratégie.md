---
name: Le Club Vanzon — Stratégie gratuite
description: Le Club (ex Club Privé) est 100% gratuit — fidélisation, SEO, base de premiers propriétaires/locataires marketplace
type: project
---

## Stratégie Le Club (depuis mars 2026)

Renommé "Le Club" (plus "Club Privé"). **Entièrement gratuit** pour tous les utilisateurs inscrits.

**Pourquoi :** Apporter de la valeur gratuitement pour fidéliser, réduire le taux de rebond, et constituer une base d'utilisateurs engagés. Double rôle stratégique :
1. Signal SEO positif (engagement Google)
2. Vivier de premiers propriétaires et locataires pour la marketplace

**How to apply :**
- Appeler "Le Club" (pas "Club Privé")
- Ne jamais mentionner "9,99€", "abonnement mensuel", ou tout prix
- Toujours présenter comme "100% gratuit"
- CTAs : "Rejoindre gratuitement" (pas "S'abonner")
- Aucune référence à Stripe pour Le Club
- Le Club est un levier d'amorçage pour la marketplace : membres = premiers utilisateurs potentiels

---

**Code Stripe supprimé (avril 2026)**
Lors du refactoring architecture (branche `refactor/architecture-2020`, commit 2), tout le code Stripe lié au Club a été supprimé :
- `src/lib/club/stripe.ts` — supprimé
- `src/app/api/club/stripe/` — routes API supprimées (checkout, webhook, portal)
- Aucun résidu Stripe dans le codebase pour le Club
