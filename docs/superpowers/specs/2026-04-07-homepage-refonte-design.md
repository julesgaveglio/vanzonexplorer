# Spec — Refonte Homepage Vanzon Explorer

**Date :** 2026-04-07  
**Statut :** Validé par Jules

---

## Contexte et objectif

Vanzon Explorer évolue d'une agence de location locale (Pays Basque) vers une **plateforme nationale de location de vans aménagés**. 4 vans externes sont déjà référencés, objectif 50 propriétaires en phase de lancement.

La homepage actuelle communique "agence locale" alors que la vision est "plateforme". L'objectif de cette refonte est d'aligner le message et la structure de la homepage avec cette vision, sans attendre d'avoir 25+ vans (pas de barre de recherche globale pour l'instant).

---

## Ce qui NE change pas

- Le hero image, le H1, les stats glassmorphism en bas à droite
- La trust bar (assurance Yescapa, Pays Basque, avis Google)
- Les cards vans (MarketplaceVansSection)
- Les sections Pays Basque éditorial + destinations grid (SEO local intact)
- La section avis clients
- La section VBA formation
- RoadTripCTA et OtherServices

---

## Modifications

### 1. Hero — sous-titre et bouton secondaire

**Sous-titre actuel :**
> "Location, achat de vans aménagés au Pays Basque, et formation Van Business Academy partout en France."

**Nouveau sous-titre :**
> "Louez un van aménagé partout en France. Dès 65€/nuit, assurance incluse."

**Bouton secondaire actuel :** "Acheter un van →" (`/achat`)

**Nouveau bouton secondaire :** "Proposer mon van →" (`/proprietaire`)

Raisonnement : "Acheter un van" concerne une minorité de visiteurs et sera accessible via OtherServices. "Proposer mon van" capte les propriétaires dès le hero — carburant principal de la plateforme à ce stade.

---

### 2. MarketplaceVansSection — filtre région + badge

**Titre de section :** `"Vans disponibles en France"` (déjà présent dans le composant — aucun changement).

**Filtre région :** Ajouter des pills de filtre au-dessus de la grille. Le composant charge deux sources :
- **Vans officiels Vanzon** (Sanity, `getAllLocationVansQuery`) → toujours Pays Basque
- **Vans marketplace** (Supabase `marketplace_vans`, champ `location_city`) → source pour les autres régions

Les pills sont générées dynamiquement depuis les valeurs uniques de `location_city` dans Supabase + "Pays Basque" fixe pour les vans Sanity. Format : `Tous | Pays Basque | [autres villes/régions]`. Si une région n'a qu'un van en `status = "approved"`, la pill apparaît quand même.

Le filtre est côté client (state React) — `MarketplaceVansSection` devra devenir un Client Component ou être découpé en un wrapper client + données serveur passées en props.

**Badge vans Vanzon :** Tout van provenant de `officialVans` (Sanity) reçoit le badge `★ Van Vanzon`. La séparation est déjà propre dans le code (deux tableaux distincts). Aucune logique d'identification par nom — si c'est dans Sanity, c'est un van Vanzon.

**Mobile :** Le filtre en pills passe en scroll horizontal sur mobile (`overflow-x-auto`, une ligne).

---

### 3. Nouvelle section — CTA Propriétaires

**Position :** Juste après MarketplaceVansSection, avant la section Pays Basque éditorial.

**Contenu :**
- Titre : "Propriétaire de van ? Référencez-le gratuitement."
- Sous-titre : "Votre van, une page dédiée, visible par des milliers de voyageurs. 0% de commission pendant la phase de lancement."
- CTA : "Référencer mon van →" → `/proprietaire`

**Design :** Section courte, sobre (pas de fond plein, intégrée dans le flow). Pas d'image obligatoire — du texte et un bouton suffisent. Sur mobile : layout full-width, texte centré, bouton full-width.

---

### 4. Réordonnancement des sections

Ordre final de la homepage :

| # | Section | Statut |
|---|---------|--------|
| 1 | Hero | Modifié (sous-titre + bouton) |
| 2 | Trust bar | Inchangé |
| 3 | MarketplaceVansSection | Modifié (filtre + badge) |
| 4 | CTA Propriétaires | Nouveau |
| 5 | Pays Basque éditorial | Inchangé |
| 6 | Destinations grid | Inchangé |
| 7 | Avis clients | Inchangé |
| 8 | Formation VBA | Inchangé |
| 9 | RoadTripCTA | Inchangé |
| 10 | OtherServices (achat van ici) | Inchangé |

---

## Ce qui est explicitement hors scope

- Barre de recherche globale (destination + dates) dans le hero → à faire quand 25+ vans référencés
- Système de filtrage avancé (dates, prix, capacité)
- Modification des pages vans individuelles
- Modification de /proprietaire

---

## Critères de succès

- La homepage communique "plateforme nationale" dès le sous-titre du hero
- Un propriétaire de van qui atterrit sur la homepage voit un CTA clair pour référencer son van
- Les vans Vanzon (Yoni, Xalbat) sont clairement identifiables visuellement dans la grille
- Le filtre région fonctionne sans afficher de régions vides
- Le SEO local Pays Basque n'est pas dégradé (sections existantes conservées)
