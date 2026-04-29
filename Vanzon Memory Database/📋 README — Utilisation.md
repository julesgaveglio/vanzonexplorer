# 📋 README — Utilisation de la Vanzon Memory Database

> Base de connaissance structurée en deux niveaux : public et interne.

---

## 🌐 PUBLIC — Données accessibles aux agents IA

Dossier `🌐 PUBLIC/` — contenu utilisable par le blog agent, les LLM externes, et tout système automatisé.

**Règle :** aucune information sensible ici. Que des éléments qu'on pourrait publier sans risque.

| Sous-dossier  | Contenu                                                   |
| ------------- | --------------------------------------------------------- |
| `marque/`     | Valeurs, vision, ce qui nous énerve, Van Business Academy |
| `equipe/`     | Profil Jules (public)                                     |
| `vans/`       | Fiches Yoni & Xalbat                                      |
| `histoire/`   | Naissance de Vanzon, tour du monde de Jules               |
| `anecdotes/`  | Anecdotes locataires et moments fondateurs                |
| `territoire/` | Pays Basque — notre terrain de jeu                        |
| `blog/`       | Idées articles, angles éditoriaux, opinions               |
| `formation/`  | Contenu formation Van Business (public)                   |

**Utilisé par :** `scripts/agents/blog-writer-agent.ts` via `VANZON_DB_PATH = "Vanzon Memory Database/🌐 PUBLIC"`

---

## 🔒 INTERNE — Données stratégiques confidentielles

Dossier `🔒 INTERNE/` — réservé au travail stratégique avec Claude. Ne jamais injecter dans des prompts envoyés à des LLM non maîtrisés.

| Sous-dossier | Contenu |
|---|---|
| `equipe/` | Mario — profil, risques, contrat absent |
| `strategie/` | Objectif Thaïlande, marketplace vision, infrastructure SEO |
| `legal/` | Risques juridiques, points légaux marketplace |

**Utilisé par :** sessions Claude Code uniquement (travail stratégique et planification).

---

## Règles de mise à jour

1. **Nouveau contenu public** (anecdote, van, article) → `🌐 PUBLIC/`
2. **Nouvelle décision stratégique** (revenus, associés, legal) → `🔒 INTERNE/`
3. **Mettre à jour `🏠 INDEX.md`** à chaque ajout de fichier
4. **Ne jamais mettre de chiffres financiers, de % capital ou de noms d'associés avec tensions** dans `PUBLIC/`
