# Spec — Redesign pages location ville (template CTA-first)

**Date :** 2026-05-03
**Pilote :** Biarritz
**Objectif :** Maximiser le clic vers Yescapa/Wikicampers en montrant les vans immédiatement après le hero.

## Contexte

Le site vanzonexplorer.com est une couche d'acquisition SEO. Les pages villes redirigent vers les plateformes de location (Yescapa, Wikicampers) qui gèrent assurance + paiement. L'objectif est de réduire la distance entre l'arrivée sur la page et le clic de réservation.

## Structure du template (8 sections)

### 1. Hero (compact, ~60vh)
- Breadcrumb (Accueil > Location > [Ville])
- Badge "5/5 sur Google" (sans nombre d'avis)
- H1 : "Location van aménagé à [Ville]"
- Sous-titre court (1 ligne, spécifique à la ville)
- 1 CTA : "Voir nos vans" (ancre #nos-vans)
- Pas de stats desktop, pas de flèche scroll
- Photo Pexels hero (1 seul appel, pas 7)

### 2. Vans disponibles (position 2, immédiatement visible)
- id="nos-vans"
- Composant `VanSelectionSection` existant
- Trust micro-bar intégrée : "Assurance incluse • Départ Cambo ([X] min) • Annulation flexible"

### 3. Témoignage Google (1 avis)
- 1 citation d'avis Google (hardcodé, tiré des vrais avis)
- Étoiles + nom + "Client Google Maps"
- Style glass-card compact

### 4. Activités (3 au lieu de 6)
- Titre : "Que faire à [Ville] en van ?"
- 3 cards avec photos Pexels (au lieu de 6 = 3 appels Pexels économisés)
- Même style visuel qu'actuellement

### 5. Itinéraire week-end
- Inchangé (Ven/Sam/Dim timeline)
- Bon pour SEO "itinéraire week-end [ville] van"

### 6. Infos pratiques + Carte (fusionnées)
- `PracticalInfoSection` existant
- Google Maps iframe intégré dans la même section (en dessous des infos)

### 7. FAQ
- Inchangé (schema FAQPage JSON-LD)
- Accordion glass-card

### 8. CTA final
- Fond sombre gradient
- 2 boutons : Yescapa + Wikicampers
- Lien road trip

## Appels Pexels
- Avant : 7 appels (hero + 6 activités)
- Après : 4 appels (hero + 3 activités)

## Google reviews
- Partout : "5/5 sur Google" sans nombre d'avis (cohérent avec homepage)

## Duplication
- Biarritz = template pilote
- Une fois validé, dupliquer sur : Hossegor, Bayonne, Saint-Jean-de-Luz, Week-end, Forêt d'Irati
- Chaque ville garde son contenu spécifique (activités, itinéraire, FAQ, infos pratiques)
