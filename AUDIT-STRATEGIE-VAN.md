# Audit stratégique — Vente / Location / Aménagement / VASP / Budget

> Généré le 2026-07-09. Sources croisées : Vanzon Memory Database (fichiers Boss + Stratégie, avril-mai 2026), contenu réel de la formation VBA (`scripts/vba-generate-pdfs.ts`), et requêtes live sur Supabase (profils VBA, réservations, transactions financières) au moment de la rédaction. Les écarts entre la Memory Database et les données live sont signalés explicitement — c'est une partie du diagnostic.

---

## 0. Verdict en une phrase

Le modèle économique du van (acheter → aménager → louer → revendre) est **prouvé et documenté avec des vrais chiffres**, mais Vanzon **n'applique pas à sa propre flotte la stratégie qu'elle vend** (aucun des 2 vans n'est VASP alors que Jules dit lui-même regretter ce choix), et le plan d'expansion censé corriger ça est **entièrement suspendu à une dépendance externe non maîtrisée** (les fonds de Mario, bloqués par les problèmes de sa société SigmaFactory.fr).

---

## 1. État des lieux chiffré

### 1.1 La flotte réelle (Yoni + Xalbat)

| | Yoni | Xalbat |
|---|---|---|
| Véhicule | Renault Trafic, vert | Renault Trafic 3, blanc |
| Homologation | **CTTE — PAS VASP** | **CTTE — PAS VASP** |
| Plateformes | Yescapa (16% commission) + Wikicampers | idem |
| Point de départ | Cambo-les-Bains (64250) | idem |
| Tarifs | 65€ (basse) / 75€ (moyenne) / 95€ (haute saison) | idem |

**Règle absolue documentée en interne** : ne jamais présenter Yoni ou Xalbat comme des VASP dans le contenu public — ce sont des utilitaires aménagés, pas des véhicules de loisirs homologués.

**Aveu documenté de Jules sur Yoni** (`🌐 PUBLIC/vans/🚐 Flotte complète.md`) :
> "Ce qu'il referait différemment : faire directement un aménagement VASP — meilleur pour la revente (+5 000€), assurances moins chères, protection en cas d'accident."

Ce regret est écrit noir sur blanc dans la base de connaissance interne. Deux ans plus tard, **aucun des deux vans n'a été mis aux normes VASP a posteriori**, et ce n'est mentionné nulle part comme un chantier en cours.

### 1.2 Activité réelle mesurée (Supabase, au 2026-07-09)

- **12 réservations** enregistrées, réparties sur la période 2025-08-12 → 2026-07-27, pour un total de **~3 995€ de revenu brut**.
- ⚠️ Les libellés de van dans la table (`trafic`, `YONI - Van nomade`, `Xalbat`, `Le van du kiff`) sont **incohérents** — probablement des noms d'annonce Yescapa qui ont changé dans le temps plutôt que 4 vans distincts. Impossible d'attribuer proprement le revenu à Yoni vs Xalbat sans nettoyer cette donnée. **C'est un problème de qualité de données qui empêche un pilotage fin de la rentabilité par van.**
- Table `finance_transactions` (102 lignes, juin 2025 → mai 2026) : entité `yoni` = 570€ encaissés / 255€ dépensés ; entité `xalbat` = 330€ encaissés / 255€ dépensés. Ces montants sont **très inférieurs** aux ~400-750€/mois annoncés dans Business.md — cohérent avec le fait que le sync Qonto ne capte probablement pas tous les virements Yescapa, ou que la période couverte est partielle. **Deuxième signal de fiabilité financière à corriger avant de prendre des décisions d'investissement dessus.**

### 1.3 Formation VBA — écart Memory Database vs réalité live

- **Documenté dans la Memory Database (avril 2026)** : 1 seule vente (Amine, 997€).
- **Mesuré en base aujourd'hui** : 6 comptes avec `plan = vba_member`, dont 2 sont le compte personnel de Jules (doublon, re-connexions), 1 est un compte générique `vanzonexplorer@gmail.com` (probablement un compte de démo/admin) — soit **3 comptes élèves distincts et identifiables** (Fontaine, Cledat de la Vigerie, Mélissa), créés entre le 6 et le 10 juin 2026.
- Or `finance_transactions` ne montre qu'**un seul encaissement VBA de 997€** sur toute la période. **Incohérence à trancher** : soit ces 3 comptes ont eu accès via un code promo gratuit (`OFFREDELANCEMENT`, mécanisme qui existe dans le code — `api/stripe/free-access`) et ne sont pas des ventes payantes, soit ce sont de vraies ventes dont l'encaissement Qonto n'est pas encore synchronisé dans `finance_transactions`. **Dans les deux cas, le nombre réel de ventes payantes de la formation n'est aujourd'hui fiable nulle part dans le système** — ni dans la Memory Database (obsolète), ni dans Supabase (signal contradictoire).

---

## 2. Pilier 1 — Achat & budget véhicule

Chiffres enseignés dans la formation (Module 2, réels/vécus) :

| Critère | Valeur |
|---|---|
| Modèle recommandé | Renault Trafic 3 (après 2014), parois droites, moteur durable jusqu'à 500 000 km bien entretenu |
| Budget véhicule max | 10 000€ |
| Kilométrage max | 200 000 km |
| Négociation moyenne obtenue | 5 à 15% du prix affiché |
| Configuration | L2H1 (confort) vs L1H1 (rentabilité pure, meilleur ratio location) |

**Point de vigilance transmis aux élèves** : rouille perforante = non-négociable, on part. Vérifier systématiquement l'usage précédent (pro = usure accélérée, perso = mieux entretenu). Ce filtre est solide et cohérent avec le vécu réel de Jules (van acheté 9 000€).

---

## 3. Pilier 2 — Aménagement : budget réel

### Cas réel Jules (base du storytelling commercial)
- Véhicule : 9 000€
- Aménagement : 5 000€
- **Total cycle : 14 000€**
- 8 mois de location : +5 500€ nets
- Revente estimée : 21 000€+

### Comparatif documenté dans la banque de preuves commerciales (`proof-bank.md`)

| | Sans accompagnement | Avec accompagnement (VBA) |
|---|---|---|
| Véhicule | 13 000€ | 10 000€ (négocié) |
| Aménagement | 10 600€ | 5 000€ |
| **Total** | **23 600€** | **15 000€** |
| Temps travaux | 8 mois | 3 mois |
| Mise en location | Non prévue | 7 000€/an |
| Revente | Mauvaise, non optimisée | Optimisée (+5 000€ si VASP) |

**Économie moyenne affichée : 8 600€** — c'est l'argument de vente central de la formation, chiffré et cohérent avec les données terrain.

**Composition budget réel (module 3)** : ~5 430€ décomposés en contreplaqué peuplier 15mm + OSB3, isolation ArmaFlex 19mm, kit outils Ryobi (~508€), bois chez un fournisseur pro (Dispano, nettement moins cher que la distribution grand public). Erreur n°1 identifiée chez les débutants : trop de rangement, pas assez d'espace de vie.

**Constat d'audit** : ce budget de ~5 000-5 500€ est réaliste et documenté avec des factures réelles — c'est un des points les plus solides de toute la stratégie. Le risque est ailleurs : ce chiffre est celui d'un **aménagement non-VASP**. La formation ne présente nulle part un budget d'aménagement VASP consolidé et chiffré de la même façon (le contenu VASP est encore en tournage — Module 8, 20 vidéos, non terminé au moment du dernier diagnostic interne).

---

## 4. Pilier 3 — VASP : la décision qui structure tout le reste

### Ce que dit la formation (Modules 6-9)
- VASP = Véhicule Automoteur Spécialement Aménagé (carte grise camping-car).
- **Pas obligatoire** si aménagement simple, sans gaz fixe, sans modification de structure.
- **Obligatoire** si gaz fixe installé, modification de structure, ou volonté de conformité camping-car complète.
- Coût d'homologation : **600 à 1 500€** selon la région (DREAL).
- Bénéfice chiffré : **+5 000€ minimum** à la revente vs un van équivalent non-VASP.
- Process complet documenté : pesée avant dépôt de dossier, certificat de conformité barré rouge, étiquettes obligatoires, photos de chaque norme respectée, dépôt DREAL (délai 2 semaines à 2 mois).

### Ce que dit la doctrine commerciale interne
> "Pour la location pure, le non-VASP suffit dans 90% des cas. Si tu veux faire de l'achat-revente, le VASP est quasi obligatoire pour maximiser la plus-value."

C'est un cadre de décision cohérent et bien articulé pédagogiquement. **Le problème n'est pas le cadre — c'est que Vanzon elle-même est dans le mauvais case du cadre.** Vanzon fait à la fois de la location ET de la revente (page `/achat`, vente de Yoni/Xalbat à 23 500€ pièce) sans être VASP, alors que sa propre doctrine dit que le VASP est "quasi obligatoire" dès qu'il y a une logique de revente.

### Coût réel de ne pas être VASP, chiffré
- Manque à gagner à la revente : **~5 000€ par van**, soit potentiellement **10 000€ sur les 2 vans actuels** si revendus tels quels.
- Assurance : coût plus élevé et protection juridique plus faible en cas d'accident (affirmation de Jules lui-même, non chiffrée précisément dans la base — **angle mort : aucun devis comparatif VASP vs non-VASP n'est documenté nulle part**, alors que c'est un argument central répété).

---

## 5. Pilier 4 — Location : modèle économique réel

| Paramètre | Valeur documentée |
|---|---|
| Plateformes | Yescapa (16% commission) + Wikicampers |
| Tarifs | 65€ / 75€ / 95€ selon saison |
| Taux d'occupation réaliste | 7 jours/mois en moyenne annualisée (**pas 10** — correction explicite dans la doc interne, signe qu'un chiffre optimiste a circulé et a été recadré) |
| Revenu par van | 5 000 à 9 000€/an nets |
| Seuil micro-BIC | 8 200€/an — en dessous, rester en déclaration particulier |
| Caution | 1 500-2 000€, restituée intégralement si van rendu propre (taux de sinistre quasi nul documenté : un seul incident en 2 ans, 15€ de dégât) |

**Le site vanzonexplorer.com ne fait pas de réservation directe** — c'est une couche d'acquisition SEO qui redirige vers Yescapa/Wikicampers, qui gèrent seuls l'assurance et le paiement. C'est une contrainte structurelle assumée (Vanzon ne peut pas proposer sa propre assurance) et documentée comme telle, pas un oubli.

**Écart chiffré vs réalité mesurée** : le doc interne annonce 400-750€/mois de revenu total flotte. Les données Supabase (réservations + finance_transactions) suggèrent un revenu tracké nettement inférieur sur la période récente — voir section 1.2. Soit le tracking est incomplet, soit l'activité réelle a ralenti par rapport à ce qui est documenté. **À vérifier avant toute décision basée sur ce chiffre.**

---

## 6. Pilier 5 — Vente / Revente : la stratégie patrimoniale

### Le cycle vertueux théorique
Acheter → aménager → louer 2-3 ans → revendre avec plus-value → réinvestir dans le van suivant. Documenté comme le modèle économique de fond, au-delà du simple loyer mensuel.

### Le projet d'expansion — statut réel : bloqué

| Paramètre | Valeur |
|---|---|
| Budget | 38 000€ pour 2 vans supplémentaires |
| Financement | Apport de Mario (fonds propres SAS) — **nécessite un endettement**, pas du cash disponible |
| Homologation prévue | VASP dès le départ (contrairement à Yoni/Xalbat) |
| Phase 1 | Location immédiate |
| Phase 2 | Revente à 2-3 ans, estimée 50 000-55 000€ |
| Plus-value potentielle | ~12 000-17 000€ brut |
| **Statut au dernier point** | 🔴 **Bloqué** — Mario n'a pas injecté les fonds, ses problèmes chez SigmaFactory.fr créent des retards en cascade |

**C'est le point le plus critique de tout l'audit.** Le seul projet qui corrigerait l'écart stratégique identifié en section 4 (flotte non-VASP) est **entièrement dépendant d'un tiers externe (Mario) dont l'entreprise personnelle traverse des difficultés**, sans contrat écrit encadrant cet apport, sans timeline, et sans plan B documenté. La Memory Database le dit elle-même :

> "Ne pas compter ces vans dans les projections financières tant que Mario n'a pas injecté. C'est un upside potentiel, pas une base."

Ce principe de prudence est le bon réflexe — mais il signifie aussi que **la stratégie de revente à plus-value de Vanzon n'a aucun véhicule support fiable aujourd'hui**, seulement des vans qui, s'ils étaient revendus maintenant, laisseraient ~5 000€ chacun sur la table faute d'homologation.

---

## 7. Comparatif chiffré consolidé — non-VASP vs VASP

| | Van non-VASP (situation actuelle Yoni/Xalbat) | Van VASP (situation cible expansion) |
|---|---|---|
| Achat | ~9 000-10 000€ | ~9 000-10 000€ |
| Aménagement | ~5 000-5 500€ | ~5 000-5 500€ + 600-1 500€ homologation |
| **Coût total** | **~14 000-15 500€** | **~15 000-17 000€** |
| Location | 5 000-9 000€/an | équivalent (a priori), assurance moins chère (non chiffré précisément) |
| Revente | Prix marché standard | +5 000€ minimum |
| Délai supplémentaire | Aucun | 2 semaines à 2 mois (dossier DREAL) |
| **Surcoût VASP vs gain revente** | — | **+1 000-1 500€ de coût pour +5 000€ de gain, soit un ROI net positif de ~3 500-4 000€ par van sur le cycle complet** |

Le calcul est net et favorable au VASP. Ce n'est pas une zone grise — c'est un choix rationnellement tranché dans la formation elle-même, juste pas appliqué à la propre flotte de l'entreprise qui l'enseigne.

---

## 8. Angles morts identifiés

1. **Incohérence produit/preuve** — VBA enseigne que le VASP est "quasi obligatoire" pour l'achat-revente, mais Vanzon vend elle-même Yoni et Xalbat (non-VASP) sur `/achat`. Un élève qui compare l'enseignement à l'exemple du fondateur peut légitimement se demander pourquoi Jules ne l'a pas fait lui-même.
2. **Single point of failure sur l'expansion** — le seul chantier qui financerait des vans VASP dépend à 100% de la trésorerie personnelle de Mario, lui-même absorbé par sa propre entreprise. Aucun plan B (crédit pro, réinvestissement du cash VBA, apport personnel de Jules) n'est documenté comme alternative.
3. **Fiabilité des données financières** — trois sources (Memory Database, `finance_transactions`, `reservations`) donnent trois ordres de grandeur différents pour le revenu locatif réel. Impossible aujourd'hui de savoir avec certitude combien la flotte rapporte réellement au mois près.
4. **Nommage incohérent des réservations** — 4 libellés de van différents dans la table `reservations` pour vraisemblablement 2 véhicules réels, ce qui empêche tout calcul de rentabilité par van individuellement.
5. **Décalage ventes VBA documentées vs réelles** — la Memory Database (source that alimente l'agent Boss) affiche 1 vente ; la base affiche 3 comptes élèves distincts récents non reflétés dans les fichiers Core. **Le système de pilotage stratégique (Boss) risque de raisonner sur une image du business vieille de deux mois.**
6. **Aucun chiffrage de l'écart d'assurance VASP vs non-VASP** — argument répété ("assurances moins chères") mais jamais backé par un devis ou un chiffre concret dans la base, contrairement au reste de la stratégie qui est très factuel.

---

## 9. Plan d'action priorisé

**Priorité 1 — Fiabiliser les données avant toute décision**
- Nettoyer les libellés `van_name` dans `reservations` pour distinguer proprement Yoni/Xalbat.
- Réconcilier `finance_transactions` (entité vba) avec les vrais comptes `vba_member` : identifier lesquels des 3 nouveaux comptes élèves sont des ventes payantes vs des accès promo gratuits.
- Mettre à jour `Diagnosis.md` et `Actions.md` dans la Memory Database avec ces chiffres réels — le Boss agent raisonne actuellement sur des données obsolètes.

**Priorité 2 — Trancher la question VASP sur la flotte existante**
- Chiffrer précisément le coût d'une homologation VASP a posteriori sur Yoni et/ou Xalbat (les 600-1 500€ + éventuels travaux de mise en conformité manquants).
- Décider : homologuer maintenant (cohérence produit + capture de la plus-value avant une revente future) ou assumer explicitement le choix de rester non-VASP et arrêter de le présenter comme un regret dans la doc interne.

**Priorité 3 — Débloquer ou remplacer le financement de l'expansion**
- Fixer une deadline avec Mario sur l'injection des 38 000€, avec un point de sortie clair si non tenue.
- Chiffrer une alternative 100% Vanzon (réinvestissement du cash VBA une fois 10 ventes atteintes, ou crédit pro pour 1 seul van VASP plutôt que 2) pour ne plus dépendre uniquement de Mario.

**Priorité 4 — Chiffrer l'argument assurance VASP**
- Obtenir un devis comparatif réel (assureur pro type April/Alptis) VASP vs CTTE aménagé, pour soit renforcer l'argument commercial avec un vrai chiffre, soit le retirer s'il ne tient pas.

---

## 10. Ce qu'il faut retenir

La mécanique produit (achat → aménagement → VASP → location → revente) est **solide, chiffrée et pédagogiquement bien construite** — c'est probablement l'actif le plus robuste de toute l'entreprise. Le problème n'est pas la stratégie elle-même, c'est que **Vanzon ne se l'applique pas à elle-même** sur le point le plus rentable du modèle (le VASP), et que le seul projet censé corriger ça est suspendu à une dépendance externe non sécurisée. Avant de vendre plus de formations sur "comment maximiser la plus-value avec le VASP", il y a une question de cohérence à trancher en interne — et avant de prendre une décision d'investissement sur la flotte, il y a un travail de fiabilisation des chiffres à faire, parce qu'aujourd'hui trois sources internes ne racontent pas la même histoire.
