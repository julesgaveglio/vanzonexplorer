---
name: feedback_email_template
description: Style imposé pour tous les emails envoyés depuis Vanzon Explorer — fond blanc, logo officiel, rappels dégradé bleu
type: feedback
---

Tous les emails envoyés depuis Vanzon Explorer (éditeur, road trip, prospection, etc.) doivent respecter ce style :

- **Fond** : blanc (`#ffffff`), jamais sombre
- **Logo** : toujours présent en haut, URL officielle : `https://cdn.sanity.io/images/lewexa74/production/b7dc1f4d7df2897875bab8c7d4b5e1f98dc7b774-1200x800.webp?w=600&h=450&fit=crop&auto=format&q=80` — largeur 180px en header, 80px en footer (ratio 3:2 paysage)
- **Dégradé bleu officiel** : `linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)` — utilisé sur la barre header, les boutons CTA, et les accents
- **Typographie** : Inter ou Arial, texte principal `#0F172A`, secondaire `#64748B`
- **Style** : épuré, minimaliste, beaucoup d'espace blanc, pas de fond sombre
- **Largeur** : `max-width: 600px`, centré, `padding: 40px 20px`
- **Footer** : `vanzonexplorer.com` en petit, couleur `#94A3B8`

**Why:** Jules veut une identité visuelle cohérente sur tous les emails — blanc + bleu dégradé = charte officielle Vanzon.
**How to apply:** Chaque fois qu'on crée ou modifie un template HTML d'email dans ce projet, appliquer systématiquement ce style.
