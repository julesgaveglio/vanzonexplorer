# Vanzon Explorer — Agents System

This directory contains agent prompt files for Claude Code. Each file defines a specialized AI agent with its role, context, tools, and step-by-step instructions. The agents automate SEO-driven content production and site optimization for [vanzonexplorer.com](https://vanzonexplorer.com).

---

## What the Agents System Does

The agents system orchestrates three core workflows:

1. **Blog writing** — Researches keywords with DataForSEO, writes structured SEO articles in French, fetches a Pexels cover image, and publishes directly to Sanity CMS.
2. **SEO analysis** — Audits keywords, competitor rankings, content gaps, and backlink profiles using DataForSEO MCP tools, then produces prioritized action items.
3. **Agent creation** — The orchestrator can scaffold new agents and slash commands, following the naming and template conventions for this project.

Agents are invoked through Claude Code slash commands (defined in `.claude/commands/`) or called directly from automation scripts in `scripts/agents/`.

---

## Available Slash Commands

### `/write-article [slug|next]`

Writes and publishes a full SEO article for Vanzon Explorer.

- Pass a specific article slug to write that article: `/write-article bivouac-pays-basque`
- Pass `next` to pick the next pending article from the queue: `/write-article next`
- The agent reads `scripts/data/article-queue.json`, runs keyword research, writes the article, and publishes it via `scripts/agents/blog-writer-agent.ts`.

Full instructions: `agents/blog-writer.md`

### `/analyze-seo [keyword|url]`

Runs a complete SEO audit for a keyword or a URL.

- Keyword analysis: `/analyze-seo "location van pays basque"`
- URL audit: `/analyze-seo vanzonexplorer.com/articles/bivouac-pays-basque`
- Produces a structured report: keyword metrics, top competitors, content gaps, recommended actions.

Full instructions: `agents/seo-analyzer.md`

### `/create-agent [type name]`

Scaffolds a new agent or skill file for this project.

- Create a new agent: `/create-agent agent blog-optimizer`
- Create a new skill: `/create-agent skill fetch-serp`
- The orchestrator creates both `agents/<name>.md` and `.claude/commands/<name>.md`.

Full instructions: `agents/orchestrator.md`

---

## Available Agents

| Agent | File | Slash Command | Description |
|---|---|---|---|
| Blog Writer | `agents/blog-writer.md` | `/write-article` | SEO article writer for the French vanlife market |
| SEO Analyzer | `agents/seo-analyzer.md` | `/analyze-seo` | DataForSEO-powered keyword and competitor audits |
| Orchestrator | `agents/orchestrator.md` | `/create-agent` | Creates new agents and slash commands |

---

## How to Create a New Agent

1. Run `/create-agent agent <name>` in Claude Code, or manually follow these steps:

2. Create `agents/<name>.md` using the standard template (see `agents/orchestrator.md` for the full template). Required sections:
   - `# Agent: [Name]`
   - `## Role`
   - `## Context`
   - `## Instructions` (numbered steps)
   - `## Tools Available`
   - `## Output Format`

3. Create `.claude/commands/<name>.md` with the invocation instruction:
   ```
   Lance l'agent <name> en lisant agents/<name>.md.
   Argument : $ARGUMENTS
   ```

4. If the agent needs automation (scheduled runs), create `scripts/agents/<name>-agent.ts`.

5. Document the new agent in this README under "Available Agents".

---

## How to Add an Article to the Queue

Articles are managed via `scripts/data/article-queue.json`. Each entry has this shape:

```json
{
  "slug": "bivouac-pays-basque-van",
  "keyword": "bivouac pays basque van",
  "category": "Road Trips",
  "tag": "Guide complet",
  "status": "pending",
  "priority": 1,
  "notes": "Cibler les randonneurs avec van — keywords longue traîne"
}
```

**Status values:**
- `pending` — not yet written
- `in_progress` — currently being written
- `published` — live on the site
- `skipped` — intentionally deferred

**To add an article:**
1. Open `scripts/data/article-queue.json`
2. Add a new entry with `"status": "pending"`
3. Set `priority` (lower number = higher priority; `1` is written first)
4. Run `/write-article next` to process the next pending article

**To write a specific article immediately**, pass its slug directly: `/write-article bivouac-pays-basque-van`

---

## Project Architecture Reference

- **Next.js 14 App Router** — `src/app/(site)/` for public pages
- **Sanity CMS** — articles, vans, testimonials, Pays Basque spots
- **Supabase** — profiles, saved products, vans_location table
- **Clerk** — authentication (only `/dashboard` is protected)
- **DataForSEO** — keyword research and SERP analysis (`src/lib/dataforseo.ts`)
- **Pexels** — cover image sourcing (`src/lib/pexels.ts`)
- **Sanity Admin Client** — write access via `SANITY_API_WRITE_TOKEN` (`src/lib/sanity/adminClient.ts`)

Key constants (from `src/lib/dataforseo.ts`):
- `DFS_TARGET` = `vanzonexplorer.com`
- `DFS_LOCATION` = `France`
- `DFS_LANGUAGE` = `fr`
- `DFS_LOCATION_CODE` = `2250`
