---
name: Toujours ajouter les nouveaux agents au registry admin
description: Règle : chaque nouvel agent créé doit être ajouté au registry.json et visible dans /admin/agents
type: feedback
---

Chaque fois qu'un nouvel agent est créé (script + GitHub Actions), l'ajouter immédiatement dans `scripts/agents/registry.json`.

**Why:** L'utilisateur veut que tous ses agents soient visibles dans son dashboard admin `/admin/agents` qui lit ce fichier JSON.

**How to apply:** Après avoir créé `scripts/agents/mon-agent.ts` et `.github/workflows/mon-agent.yml`, toujours ajouter une entrée dans `scripts/agents/registry.json` avec les champs : id, name, emoji, status, description, trigger, schedule, cronExpression, file, workflow, apis, output, manualCommand, tags, pipeline.

---

**Dashboard /admin/agents — agents automatiques uniquement**
Seuls les agents avec `trigger: "cron"` ou `trigger: "webhook"` sont affichés dans le dashboard admin. Les agents `trigger: "manual"` ne doivent jamais apparaître dans la liste (ils polluent l'interface). Le filtre est dans `AgentsClient.tsx` ligne `cronAgents = agents.filter(...)`.

**Why:** L'utilisateur veut uniquement voir les agents qui "travaillent" automatiquement, pas les outils manuels.

**How to apply:** Quand tu ajoutes un agent manuel au registry.json, ne pas l'afficher dans le dashboard. Quand tu modifies le filtre dans AgentsClient.tsx, ne jamais inclure `trigger === "manual"`.

---

**Registry complet (avril 2026)**
Lors du refactoring architecture (branche `refactor/architecture-2020`), 6 agents manquants ont été ajoutés au registry :
- `seo-auto-refresh` (cron)
- `pinterest-pinner` (cron)
- `competitor-watcher` (cron)
- `road-trip-notifier` (webhook)
- `keyword-researcher` (manual)
- `seo-checker` (manual)

Le registry `scripts/agents/registry.json` est désormais exhaustif et synchronisé avec tous les agents existants.
