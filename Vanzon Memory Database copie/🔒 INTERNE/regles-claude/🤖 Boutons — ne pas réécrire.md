---
name: Prudence avec les boutons CTA
description: Règle stricte — ne JAMAIS casser le design des boutons existants quand on change leur destination ou leur label
type: feedback
---

Quand je modifie un bouton existant (URL, label, couleur de marque partenaire), je dois **préserver strictement la structure, les classes CSS, les props et l'accessibilité** du bouton original. Je ne recrée pas le bouton depuis zéro, je fais un Edit ciblé minimal.

**Why:** Jules a déjà eu plusieurs fois des boutons cassés (design qui change, hauteur qui saute, hover perdu, shadow différente) parce que j'ai réécrit le markup au lieu d'éditer chirurgicalement le href/label/couleur. C'est frustrant parce que le design system Vanzon est précis et le moindre écart se voit immédiatement.

**How to apply:**
1. **Toujours Read** le fichier du bouton avant de modifier, identifier la structure exacte (tag, classes, props, span internes, icônes).
2. **Edit minimal** : ne changer QUE les tokens explicitement demandés (href, label, couleur de fond si partenaire). Garder toutes les classes Tailwind, shadow, rounded, padding, font-weight, transitions.
3. **Ne jamais** ajouter/retirer de `<span>`, `<svg>`, d'icônes ou de wrappers non demandés.
4. Si le bouton fait référence à une marque partenaire (Yescapa rose, Wikicampers orange, Calendly, etc.) → seul le `href`, le label textuel et éventuellement la couleur de fond changent. Le reste (dimensions, effets, structure) est intouchable.
5. Si j'ai un doute sur une classe qui pourrait être liée au design partenaire vs. au design Vanzon → demander avant de toucher.

**Contexte couleurs marque partenaire :**
- Yescapa → rose `#FF385C` ou similar
- Wikicampers → orange `#F68B1F` ou similar
- Vanzon boutons génériques → `.btn-primary`, `.btn-ghost`, `.btn-gold`
