---
name: project_article_template
description: Template centralisé des articles de blog Vanzon Explorer — fichier maître à modifier pour mettre à jour toutes les previews
type: project
---

Le template visuel des articles de blog Vanzon Explorer est centralisé dans un seul fichier :

**`src/components/article-template/ArticleTemplate.tsx`**

Modifier ce fichier met à jour instantanément toutes les pages de preview admin (`/admin/seo/editeur/[id]/preview`).

## Ce que le template reproduit exactement

- Accent color officielle : **`#4D5FEC`** (indigo — PAS #3B82F6 qui est l'accent email)
- Typo corps : Georgia/serif, 18px, line-height 1.75, couleur `#475569`
- Typo titres : Inter/sans-serif, font-black (900), couleur `#0f172a`
- Excerpt dans encadré bleu : `border-l-4 border-[#4D5FEC] bg-blue-50/40`
- TOC auto-généré depuis le HTML brut (extraction regex h2/h3)
- Sidebar TOC sticky (desktop)
- Blockquotes : `border-[#4D5FEC]`, fond `bg-blue-50/50`, italique
- Tableaux : bordures `#e2e8f0`, header `bg-slate-50`, hover rows
- Section auteur : Jules avec photo Sanity CDN
- Footer CTAs : "Louer un van" + "Tous les articles"

## Utilisation

```tsx
import ArticleTemplate from "@/components/article-template/ArticleTemplate";

<ArticleTemplate
  title="Titre de l'article"
  excerpt="Résumé..."
  html_content="<h1>...</h1><h2>...</h2>..."
  target_url="https://..."
  category="Business Van"
  publishedAt="2026-04-02"
  adminBar={<MaBarreAdmin />}  // optionnel
/>
```

**Why:** L'utilisateur voulait un template unique qui met à jour toutes les previews quand on le modifie — évite la duplication de styles entre la vraie page Sanity et l'admin.

**How to apply:** Toujours utiliser `ArticleTemplate` pour tout rendu de preview d'article dans l'admin. Ne jamais dupliquer les styles article dans d'autres composants.
