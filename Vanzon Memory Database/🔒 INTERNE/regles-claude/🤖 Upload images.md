---
name: feedback_image_upload
description: Règle upload image dans le dashboard admin — toujours deux options : bibliothèque Vanzon en premier, puis depuis l'ordinateur
type: feedback
---

Dans tout composant d'upload d'image dans le dashboard admin, toujours proposer **deux choix dans cet ordre** :
1. **Bibliothèque Vanzon** (médiathèque Sanity — `mediaAsset`) — affiché en premier
2. **Depuis l'ordinateur** (upload de fichier local)

**Why:** L'utilisateur veut réutiliser des images déjà uploadées dans la médiathèque plutôt que de re-uploader des doublons. La bibliothèque doit être le choix principal.

**How to apply:** Dès qu'un formulaire admin contient un champ image, implémenter un sélecteur avec deux onglets/boutons : "Bibliothèque Vanzon" (grid des `mediaAsset` Sanity) et "Depuis l'ordinateur" (file input classique). Appliquer cette règle même si ce n'est pas explicitement demandé.
