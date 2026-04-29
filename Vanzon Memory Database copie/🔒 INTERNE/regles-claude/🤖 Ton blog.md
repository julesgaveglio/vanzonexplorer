---
name: feedback_blog_tone
description: Ton des articles de blog Vanzon : professionnel avec vouvoiement, pas tutoiement chaleureux
type: feedback
---

Ton des articles de blog : vouvoiement professionnel par défaut, pas de tutoiement chaleureux.

**Why:** L'audience Vanzon inclut acheteurs, investisseurs et porteurs de projet — un ton trop familier/passionné ne convient pas à tous les profils.

**How to apply:** Dans tout prompt ou modification de l'agent blog-writer, utiliser "vouvoiement professionnel" et "ton expert bienveillant" — pas "tutoiement chaleureux" ni "humain passionné". Les trois fichiers à maintenir en cohérence : `scripts/agents/prompts/blog-writer.md` (primaire), `agents/blog-writer.md` (guide), fallback inline dans `blog-writer-agent.ts`.
