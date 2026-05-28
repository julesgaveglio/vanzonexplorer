---
tags:
  - boss
  - journal
status: active
---
# Journal

## 2026-04-30

**Session avec Claude Code :**
- Analyse complete de la structure VBA (10 modules, 78 lecons)
- Identifie 7 problemes majeurs : sommaire obsolete, module 4 vide, doublons, 4 lecons manquantes, VASP eparpille, fautes de titres, pas de conclusion
- Synchronise M1 + M2 + M3 + M4 avec le dossier Desktop (source de verite)
- 5 videos uploadees sur Bunny.net (Airtable M1, Comment trouver THE vehicule M2, Embrayage M2, Airtable M3, Presentation VASP M4)
- Doublons supprimes, ordres corriges
- Decision : pas de groupe communautaire VBA pour l'instant → support WhatsApp 1-to-1
- Mise en place du systeme Boss (BOS adapte pour Vanzon)
- **Prochaine action :** finir la sync des modules 5-10, puis analyser les donnees du funnel

## 2026-04-30 — Session Boss #1

**Donnees collectees :**
- Funnel 30j : 795 pages vues → 75 optins (9.4%) → 24 VSL vues (32%) → 9 VSL 100% → 3 bookings → 3 checkouts → 0 purchases trackees
- VBA members en base : 3 (tous comptes test Jules — tracking purchase casse ou vente hors tunnel)
- CPL : ~8 EUR (cible <5 EUR)
- Goulot identifie : 68% des optins ne regardent jamais la VSL (51 fantomes/mois)

**Actions produites :**
- Sequence 3 emails post-optin redigee (E1 immediat, E2 J+1, E3 J+3 — conditionnes sur vsl_view)
- Email envoye a Jules pour review
- Impact estime : +10 VSL views/mois → 3-4 bookings supplementaires sans budget ads supplementaire

**Vente VBA #1 — Amine :**
- Closing reussi a 997 EUR
- Paiement prevu debut mai 2026 (~semaine du 5 mai)
- Jules doit lui envoyer la page de paiement
- Client enchante de rejoindre le programme
- Statut : en cours de processing

**Lien paiement Amine :** envoye, paiement prevu debut mai 2026.

**Session 2 (meme jour) :**
- M6 : Introduction electricite uploadee + transcrite
- M5 : La pose de la fenetre transcrite (re-upload reussi)
- 18 titres de lecons corriges (fautes d'orthographe, accents, casses)
- Sequence email complete deployee : E2 (J+1), E3 (J+3), E4 (post-VSL 100% sans booking)
- Page optin V2 creee pour A/B test Mateo
- Cron Vercel daily 10h Paris pour les emails automatiques
- 73/73 transcrits complets

**Corrections Jules :**
- Amine n'a PAS encore paye → pas d'acces formation → pas de message WhatsApp
- Modules 7, 9, 10 deja verifies par Jules → ne plus proposer
- Prochaine action concrete : tourner la video sommaire mise a jour (M1)

**Projet Guide IKEA 3D :**
- Objectif : generer des guides d'assemblage style IKEA a partir du modele 3D Blender de l'amenagement van
- Les eleves pourront imprimer les guides papier pour avoir les plans pendant leurs travaux
- MCP Blender installe (claude mcp add blender -- uvx blender-mcp)
- Addon Blender installe et connecte (port 9876)
- Modele 3D existant : amenagement complet (cuisine fixe, evier, meubles, lit/coffre, parois)
- Prochaine etape : relancer Claude Code pour activer le MCP, scanner la scene, renommer les objets, generer les renders etape par etape
- Note : les objets sont nommes "Mesh28" etc → a renommer (cuisine, lit, meuble_droit, etc.)

**A faire au prochain /boss :**
- Relancer Claude Code avec MCP Blender actif → scanner la scene 3D
- Tourner la video sommaire M1 (10 modules + 2 parcours VASP/non-VASP)
- Verifier pourquoi le tracking purchase ne fire pas (webhook Stripe?)
- Attendre paiement Amine (debut mai)
