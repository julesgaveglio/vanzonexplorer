# Architecture Visualization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter `/admin/architecture` — un graphe interactif React Flow qui visualise tous les agents, routes API, libs internes et services externes du projet avec leurs connexions et statut opérationnel.

**Architecture:** Une API route `/api/admin/architecture` scanne le codebase statiquement (registry.json + glob des fichiers + regex imports) et retourne nodes/edges en JSON. Un Client Component React Flow rend le graphe avec layout dagre automatique, filtres par type, badge "modifié récemment" (localStorage) et panneau de détail au clic.

**Tech Stack:** `@xyflow/react` (graphe), `@dagrejs/dagre` (layout automatique), Next.js 14 App Router, TypeScript, Tailwind

---

## Chunk 1: Dépendances + Types partagés + API Route scanner

### Task 1: Installer les dépendances

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Installer les packages**

```bash
npm install @xyflow/react @dagrejs/dagre
npm install --save-dev @types/dagre
```

- [ ] **Step 2: Vérifier l'installation**

```bash
ls node_modules/@xyflow/react node_modules/@dagrejs/dagre
```
Expected: les deux dossiers existent.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add @xyflow/react and @dagrejs/dagre"
```

---

### Task 2: Définir les types partagés

**Files:**
- Create: `src/app/api/admin/architecture/types.ts`

Ce fichier contient uniquement les types TypeScript partagés entre l'API route et le client.

- [ ] **Step 1: Créer le fichier de types**

```typescript
// src/app/api/admin/architecture/types.ts

export type NodeType = 'agent' | 'api_route' | 'lib' | 'external_service'

export interface ArchNode {
  id: string
  type: NodeType
  label: string
  emoji?: string
  meta: {
    // agents
    trigger?: 'cron' | 'webhook' | 'manual'
    schedule?: string
    cronExpression?: string | null
    apis?: string[]
    file?: string
    manualCommand?: string
    pipeline?: string
    routes?: string[]
    description?: string
    // api_routes
    methods?: string[]
    section?: string
    // authRequired: détecté par présence de auth() / currentUser() / getAuth() dans le fichier
    authRequired?: boolean
    // all
    mtime?: number
  }
}

export interface ArchEdge {
  id: string
  source: string
  target: string
  type: 'calls' | 'imports' | 'consumes'
}

export interface ArchitectureResponse {
  nodes: ArchNode[]
  edges: ArchEdge[]
  scannedAt: number
}
```

- [ ] **Step 2: Vérifier que le fichier compile**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: aucune erreur.

---

### Task 3: Scanner les agents (registry.json)

**Files:**
- Create: `src/app/api/admin/architecture/scanners.ts`

Ce fichier contient toutes les fonctions de scan. Contrat d'ID : les nœuds lib ont l'ID `lib:<nom>` où `<nom>` est le premier segment du chemin après `src/lib/` (ex: `import from '@/lib/telegram-assistant/...'` → `lib:telegram-assistant`). Ce contrat est respecté par `scanLibs` et les regex d'import dans `scanApiRoutes`.

- [ ] **Step 1: Créer scanners.ts avec la fonction `scanAgents`**

```typescript
// src/app/api/admin/architecture/scanners.ts
import fs from 'fs'
import path from 'path'
import { ArchNode, ArchEdge } from './types'

const ROOT = process.cwd()

interface RegistryEntry {
  id: string
  name: string
  emoji?: string
  trigger?: string
  schedule?: string
  cronExpression?: string | null
  file?: string
  manualCommand?: string
  pipeline?: string
  apis?: string[]
  routes?: string[]
  description?: string
}

export function scanAgents(): { nodes: ArchNode[]; edges: ArchEdge[] } {
  const registryPath = path.join(ROOT, 'scripts/agents/registry.json')
  if (!fs.existsSync(registryPath)) return { nodes: [], edges: [] }

  const registry: RegistryEntry[] = JSON.parse(fs.readFileSync(registryPath, 'utf-8'))
  const nodes: ArchNode[] = []
  const edges: ArchEdge[] = []

  for (const entry of registry) {
    const filePath = entry.file ? path.join(ROOT, entry.file) : null
    const mtime = filePath && fs.existsSync(filePath)
      ? fs.statSync(filePath).mtimeMs
      : undefined

    nodes.push({
      id: `agent:${entry.id}`,
      type: 'agent',
      label: entry.name,
      emoji: entry.emoji,
      meta: {
        trigger: entry.trigger as ArchNode['meta']['trigger'],
        schedule: entry.schedule,
        cronExpression: entry.cronExpression,
        apis: entry.apis,
        file: entry.file,
        manualCommand: entry.manualCommand,
        pipeline: entry.pipeline,
        routes: entry.routes,
        description: entry.description,
        mtime,
      },
    })

    // agent → external_service edges (from registry `apis` field)
    for (const api of entry.apis ?? []) {
      edges.push({
        id: `edge:agent:${entry.id}:service:${api}`,
        source: `agent:${entry.id}`,
        target: `service:${api.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'consumes',
      })
    }

    // agent → api_route edges (from optional `routes` field in registry)
    for (const route of entry.routes ?? []) {
      edges.push({
        id: `edge:agent:${entry.id}:route:${route}`,
        source: `agent:${entry.id}`,
        target: `route:${route}`,
        type: 'calls',
      })
    }
  }

  return { nodes, edges }
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: aucune erreur.

---

### Task 4: Scanner les routes API

**Files:**
- Modify: `src/app/api/admin/architecture/scanners.ts`

- [ ] **Step 1: Ajouter `scanApiRoutes` dans scanners.ts**

```typescript
// Ajouter après scanAgents()

export function scanApiRoutes(): { nodes: ArchNode[]; edges: ArchEdge[] } {
  const apiDir = path.join(ROOT, 'src/app/api')
  const nodes: ArchNode[] = []
  const edges: ArchEdge[] = []

  function walk(dir: string) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
        const content = fs.readFileSync(full, 'utf-8')
        const relativePath = path.relative(path.join(ROOT, 'src/app/api'), path.dirname(full))
        const routePath = relativePath.replace(/\\/g, '/')
        const nodeId = `route:${routePath}`

        // Detect HTTP methods
        const methods: string[] = []
        if (/export\s+(async\s+)?function\s+GET/.test(content)) methods.push('GET')
        if (/export\s+(async\s+)?function\s+POST/.test(content)) methods.push('POST')
        if (/export\s+(async\s+)?function\s+PUT/.test(content)) methods.push('PUT')
        if (/export\s+(async\s+)?function\s+DELETE/.test(content)) methods.push('DELETE')
        if (/export\s+(async\s+)?function\s+PATCH/.test(content)) methods.push('PATCH')

        // Detect auth (Clerk)
        const authRequired = /auth\(\)|currentUser\(\)|getAuth\(/.test(content)

        // Derive section (first path segment)
        const section = routePath.split('/')[0] ?? 'other'

        const mtime = fs.statSync(full).mtimeMs

        nodes.push({
          id: nodeId,
          type: 'api_route',
          label: routePath,
          emoji: '🔗',
          meta: { methods, authRequired, section, mtime },
        })

        // route → lib edges
        // Regex captures first segment after src/lib/ → matches the lib node ID contract
        const libImports = [...content.matchAll(/from\s+['"](?:@\/|\.\.\/)*(?:src\/)?lib\/([\w-]+)/g)]
        for (const match of libImports) {
          const libName = match[1]
          edges.push({
            id: `edge:route:${routePath}:lib:${libName}`,
            source: nodeId,
            target: `lib:${libName}`,
            type: 'imports',
          })
        }
      }
    }
  }

  walk(apiDir)
  return { nodes, edges }
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: aucune erreur.

---

### Task 5: Scanner libs internes, services externes, et arêtes lib→service

**Files:**
- Modify: `src/app/api/admin/architecture/scanners.ts`

`scanLibs` produit un nœud par entrée dans `src/lib/` : une entrée par sous-répertoire ET une entrée par fichier `.ts` racine. Les IDs sont `lib:<nom>` dans les deux cas (ex: `lib:telegram-assistant`, `lib:groq-with-fallback`). Le mtime d'un répertoire lib correspond au max des mtimes des fichiers qu'il contient.

- [ ] **Step 1: Ajouter `scanLibs`, `scanExternalServices` et `buildLibServiceEdges`**

```typescript
// Ajouter après scanApiRoutes()

// Returns max mtime across all .ts files in a directory (recursive)
function maxMtimeInDir(dir: string): number {
  let max = 0
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      max = Math.max(max, maxMtimeInDir(full))
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
      max = Math.max(max, fs.statSync(full).mtimeMs)
    }
  }
  return max
}

export function scanLibs(): { nodes: ArchNode[] } {
  const libDir = path.join(ROOT, 'src/lib')
  const nodes: ArchNode[] = []
  if (!fs.existsSync(libDir)) return { nodes }

  for (const entry of fs.readdirSync(libDir, { withFileTypes: true })) {
    const full = path.join(libDir, entry.name)

    if (entry.isDirectory()) {
      const mtime = maxMtimeInDir(full)
      nodes.push({
        id: `lib:${entry.name}`,
        type: 'lib',
        label: entry.name,
        emoji: '📚',
        meta: { file: `src/lib/${entry.name}`, mtime },
      })
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      // Top-level lib files (e.g. src/lib/groq-with-fallback.ts)
      const name = entry.name.replace(/\.ts$/, '')
      const mtime = fs.statSync(full).mtimeMs
      nodes.push({
        id: `lib:${name}`,
        type: 'lib',
        label: name,
        emoji: '📚',
        meta: { file: `src/lib/${entry.name}`, mtime },
      })
    }
  }

  return { nodes }
}

const SERVICE_EMOJIS: Record<string, string> = {
  'Gemini AI': '🤖',
  'Sanity': '📦',
  'Supabase': '🗄️',
  'Groq': '⚡',
  'Telegram Bot API': '📲',
  'Resend': '📧',
  'Pexels': '📷',
  'DataForSEO': '📊',
  'Anthropic Claude': '🧠',
  'Jina AI': '🕷️',
  'Google Search Console': '🔎',
  'Pinterest API v5': '📌',
}

export function scanExternalServices(agentNodes: ArchNode[]): { nodes: ArchNode[] } {
  const servicesSet = new Set<string>()
  for (const node of agentNodes) {
    for (const api of node.meta.apis ?? []) servicesSet.add(api)
  }
  const nodes: ArchNode[] = [...servicesSet].map((name) => ({
    id: `service:${name.toLowerCase().replace(/\s+/g, '-')}`,
    type: 'external_service' as const,
    label: name,
    emoji: SERVICE_EMOJIS[name] ?? '🌐',
    meta: {},
  }))
  return { nodes }
}

// Build lib → external_service edges by scanning lib files for known service patterns
export function buildLibServiceEdges(libNodes: ArchNode[]): ArchEdge[] {
  const SERVICE_PATTERNS: { name: string; pattern: RegExp }[] = [
    { name: 'Supabase',            pattern: /createClient|supabaseAdmin|supabaseAnon/i },
    { name: 'Sanity',              pattern: /sanityClient|createClient.*sanity|@sanity/i },
    { name: 'Groq',                pattern: /groq|new Groq/i },
    { name: 'Gemini AI',           pattern: /gemini|google-generativeai/i },
    { name: 'Telegram Bot API',    pattern: /telegram|bot\.sendMessage/i },
    { name: 'Resend',              pattern: /resend|new Resend/i },
    { name: 'Anthropic Claude',    pattern: /anthropic|new Anthropic/i },
  ]
  const edges: ArchEdge[] = []

  for (const libNode of libNodes) {
    const filePath = libNode.meta.file
    if (!filePath) continue
    const fullPath = path.join(ROOT, filePath)

    // Read all .ts files in the lib (if it's a directory) or the file itself
    const filesToScan: string[] = []
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      function collectTs(dir: string) {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          const f = path.join(dir, e.name)
          if (e.isDirectory()) collectTs(f)
          else if (e.name.endsWith('.ts')) filesToScan.push(f)
        }
      }
      collectTs(fullPath)
    } else if (fs.existsSync(fullPath)) {
      filesToScan.push(fullPath)
    }

    const combined = filesToScan.map((f) => fs.readFileSync(f, 'utf-8')).join('\n')

    for (const { name, pattern } of SERVICE_PATTERNS) {
      if (pattern.test(combined)) {
        const serviceId = `service:${name.toLowerCase().replace(/\s+/g, '-')}`
        edges.push({
          id: `edge:lib:${libNode.id}:service:${serviceId}`,
          source: libNode.id,
          target: serviceId,
          type: 'consumes',
        })
      }
    }
  }

  return edges
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: aucune erreur.

---

### Task 6: Écrire l'API route principale

**Files:**
- Create: `src/app/api/admin/architecture/route.ts`

- [ ] **Step 1: Créer la route GET**

```typescript
// src/app/api/admin/architecture/route.ts
import { NextResponse } from 'next/server'
import { scanAgents, scanApiRoutes, scanLibs, scanExternalServices, buildLibServiceEdges } from './scanners'
import { ArchNode, ArchEdge, ArchitectureResponse } from './types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { nodes: agentNodes, edges: agentEdges } = scanAgents()
    const { nodes: routeNodes, edges: routeEdges } = scanApiRoutes()
    const { nodes: libNodes } = scanLibs()
    const { nodes: serviceNodes } = scanExternalServices(agentNodes)
    const libServiceEdges = buildLibServiceEdges(libNodes)

    // Deduplicate service nodes
    const seenServiceIds = new Set<string>()
    const uniqueServiceNodes = serviceNodes.filter((n) => {
      if (seenServiceIds.has(n.id)) return false
      seenServiceIds.add(n.id)
      return true
    })

    const allNodes: ArchNode[] = [
      ...agentNodes,
      ...routeNodes,
      ...libNodes,
      ...uniqueServiceNodes,
    ]

    // Deduplicate edges
    const seenEdgeIds = new Set<string>()
    const allEdges: ArchEdge[] = [...agentEdges, ...routeEdges, ...libServiceEdges].filter((e) => {
      if (seenEdgeIds.has(e.id)) return false
      seenEdgeIds.add(e.id)
      return true
    })

    // Drop edges whose source or target doesn't exist
    const nodeIds = new Set(allNodes.map((n) => n.id))
    const validEdges = allEdges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    )

    const response: ArchitectureResponse = {
      nodes: allNodes,
      edges: validEdges,
      scannedAt: Date.now(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[architecture] scan error:', error)
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Tester l'endpoint**

> Note : nécessite deux terminaux. Démarrer le dev server dans le terminal 1, curl dans le terminal 2.

Terminal 1 :
```bash
npm run dev
```

Terminal 2 :
```bash
curl -s http://localhost:3000/api/admin/architecture | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('nodes:', d.nodes.length, 'edges:', d.edges.length)"
```
Expected: `nodes: <N > 0> edges: <M >= 0>`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/architecture/
git commit -m "feat(architecture): API route - static codebase scanner"
```

---

## Chunk 2: Interface React Flow

### Task 7: Créer le nœud React Flow custom

**Files:**
- Create: `src/app/admin/(protected)/architecture/_components/ArchNode.tsx`

Ce composant est le nœud visuel affiché dans React Flow. Séparé de `ArchitectureClient.tsx` pour garder ce dernier lisible.

- [ ] **Step 1: Créer ArchNode.tsx**

```typescript
// src/app/admin/(protected)/architecture/_components/ArchNode.tsx
'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { ArchNode as ArchNodeData } from '@/app/api/admin/architecture/types'

const TYPE_COLORS: Record<string, { border: string; bg: string }> = {
  agent:            { border: '#f59e0b', bg: '#1c1700' },
  api_route:        { border: '#60a5fa', bg: '#001226' },
  lib:              { border: '#a78bfa', bg: '#120026' },
  external_service: { border: '#34d399', bg: '#001a10' },
}

function ArchNodeInner({ data, selected }: NodeProps) {
  const nodeData = data as ArchNodeData & { isUpdated?: boolean }
  const colors = TYPE_COLORS[nodeData.type] ?? TYPE_COLORS.lib

  return (
    <div
      style={{
        background: colors.bg,
        border: `1px solid ${selected ? colors.border : colors.border + '66'}`,
        borderRadius: 10,
        padding: '8px 12px',
        minWidth: 130,
        maxWidth: 160,
        position: 'relative',
        boxShadow: selected ? `0 0 16px ${colors.border}44` : 'none',
        cursor: 'pointer',
      }}
    >
      {nodeData.isUpdated && (
        <div
          style={{
            position: 'absolute', top: -5, right: -5,
            width: 10, height: 10, borderRadius: '50%',
            background: '#f97316', border: '2px solid #0f1117',
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {nodeData.emoji && <span style={{ fontSize: 14 }}>{nodeData.emoji}</span>}
        <div>
          <div style={{ fontWeight: 600, fontSize: 11, color: '#f1f5f9', lineHeight: 1.2, wordBreak: 'break-all' }}>
            {nodeData.label}
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
            {nodeData.type.replace('_', ' ')}
            {nodeData.meta?.trigger ? ` · ${nodeData.meta.trigger}` : ''}
          </div>
        </div>
      </div>

      {nodeData.type === 'agent' && nodeData.meta?.schedule && (
        <div style={{ fontSize: 9, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          {nodeData.meta.schedule}
        </div>
      )}

      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  )
}

export const ArchNodeMemo = memo(ArchNodeInner)
```

- [ ] **Step 2: Vérifier la compilation**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: aucune erreur.

---

### Task 8: Créer le panneau de détail

**Files:**
- Create: `src/app/admin/(protected)/architecture/_components/NodeDetailPanel.tsx`

Ce composant reçoit le nœud sélectionné ET toutes les arêtes du graphe pour afficher les relations "consommé par" pour les libs et services.

- [ ] **Step 1: Créer NodeDetailPanel.tsx**

```typescript
// src/app/admin/(protected)/architecture/_components/NodeDetailPanel.tsx
'use client'

import { ArchNode, ArchEdge } from '@/app/api/admin/architecture/types'

interface Props {
  node: ArchNode
  edges: ArchEdge[]
  allNodes: ArchNode[]
  onClose: () => void
}

function TagList({ items, color }: { items: string[]; color: string }) {
  if (items.length === 0) return <p style={{ fontSize: 12, color: '#64748b' }}>—</p>
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
      {items.map((item) => (
        <span key={item} style={{
          fontSize: 10, padding: '2px 7px', borderRadius: 99,
          background: `${color}22`, color, border: `1px solid ${color}33`,
        }}>
          {item}
        </span>
      ))}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '10px 16px', borderBottom: '1px solid #1e2235' }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

const V: React.CSSProperties = { fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }

export function NodeDetailPanel({ node, edges, allNodes, onClose }: Props) {
  // Compute "consumed by" for libs and services
  const consumedBy = (edges
    .filter((e) => e.target === node.id)
    .map((e) => allNodes.find((n) => n.id === e.source))
    .filter(Boolean) as ArchNode[])
    .map((n) => n.label)

  return (
    <div style={{ width: 300, background: '#1a1d27', borderLeft: '1px solid #2d3148', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
      {/* Header */}
      <div style={{ padding: 16, borderBottom: '1px solid #2d3148', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 24 }}>{node.emoji ?? '📄'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{node.label}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{node.type.replace('_', ' ')}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16, padding: 4 }}>✕</button>
      </div>

      {/* Agent */}
      {node.type === 'agent' && (
        <>
          {node.meta.description && (
            <Section label="Description"><p style={V}>{node.meta.description}</p></Section>
          )}
          {node.meta.schedule && (
            <Section label="Schedule">
              <p style={V}>{node.meta.schedule}</p>
              {node.meta.cronExpression && (
                <p style={{ ...V, fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{node.meta.cronExpression}</p>
              )}
            </Section>
          )}
          {node.meta.apis && node.meta.apis.length > 0 && (
            <Section label="APIs consommées"><TagList items={node.meta.apis} color="#60a5fa" /></Section>
          )}
          {node.meta.trigger && (
            <Section label="Trigger"><TagList items={[node.meta.trigger]} color="#f59e0b" /></Section>
          )}
          {node.meta.manualCommand && (
            <Section label="Commande manuelle">
              <code style={{ display: 'block', fontFamily: 'monospace', fontSize: 10, background: '#0f1117', padding: '6px 8px', borderRadius: 6, color: '#a78bfa', wordBreak: 'break-all' }}>
                {node.meta.manualCommand}
              </code>
            </Section>
          )}
          {node.meta.file && (
            <Section label="Fichier source">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#7c3aed', background: '#7c3aed11', padding: '4px 10px', borderRadius: 6, border: '1px solid #7c3aed33' }}>
                📄 {node.meta.file}
              </div>
            </Section>
          )}
          {node.meta.pipeline && (
            <Section label="Pipeline"><p style={V}>{node.meta.pipeline}</p></Section>
          )}
        </>
      )}

      {/* API Route */}
      {node.type === 'api_route' && (
        <>
          <Section label="Méthodes HTTP"><TagList items={node.meta.methods ?? []} color="#60a5fa" /></Section>
          <Section label="Section"><p style={V}>{node.meta.section ?? '—'}</p></Section>
          <Section label="Auth requise">
            <p style={{ ...V, color: node.meta.authRequired ? '#f59e0b' : '#34d399' }}>
              {node.meta.authRequired ? '🔒 Oui (Clerk)' : '🔓 Non'}
            </p>
          </Section>
          {consumedBy.length > 0 && (
            <Section label="Utilisé par"><TagList items={consumedBy} color="#a78bfa" /></Section>
          )}
        </>
      )}

      {/* Lib */}
      {node.type === 'lib' && (
        <>
          <Section label="Chemin">
            <p style={{ ...V, fontFamily: 'monospace', fontSize: 11 }}>{node.meta.file ?? '—'}</p>
          </Section>
          <Section label="Consommé par"><TagList items={consumedBy} color="#a78bfa" /></Section>
        </>
      )}

      {/* External service */}
      {node.type === 'external_service' && (
        <Section label="Consommé par"><TagList items={consumedBy} color="#34d399" /></Section>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: aucune erreur.

---

### Task 9: Créer ArchitectureClient.tsx

**Files:**
- Create: `src/app/admin/(protected)/architecture/ArchitectureClient.tsx`

- [ ] **Step 1: Créer ArchitectureClient.tsx**

```typescript
// src/app/admin/(protected)/architecture/ArchitectureClient.tsx
'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState, Node, Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from '@dagrejs/dagre'
import { ArchNode, ArchEdge, ArchitectureResponse, NodeType } from '@/app/api/admin/architecture/types'
import { NodeDetailPanel } from './_components/NodeDetailPanel'
import { ArchNodeMemo } from './_components/ArchNode'

const nodeTypes = { archNode: ArchNodeMemo }
const LAST_VISIT_KEY = 'arch_last_visit'

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 120 })
  nodes.forEach((n) => g.setNode(n.id, { width: 160, height: 70 }))
  edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)
  return nodes.map((n) => {
    const pos = g.node(n.id)
    return { ...n, position: { x: pos.x - 80, y: pos.y - 35 } }
  })
}

function toRFNodes(archNodes: ArchNode[], lastVisit: number | null): Node[] {
  return archNodes.map((n) => ({
    id: n.id,
    type: 'archNode',
    position: { x: 0, y: 0 },
    data: { ...n, isUpdated: lastVisit !== null && (n.meta.mtime ?? 0) > lastVisit },
  }))
}

function toRFEdges(archEdges: ArchEdge[]): Edge[] {
  return archEdges.map((e) => ({
    id: e.id, source: e.source, target: e.target,
    style: { stroke: '#2d3148', strokeWidth: 1.5 },
  }))
}

const FILTER_TYPES: { label: string; type: NodeType; color: string }[] = [
  { label: 'Agents',       type: 'agent',            color: '#f59e0b' },
  { label: 'Routes API',   type: 'api_route',         color: '#60a5fa' },
  { label: 'Libs',         type: 'lib',               color: '#a78bfa' },
  { label: 'Services ext.', type: 'external_service', color: '#34d399' },
]

export function ArchitectureClient() {
  const [data, setData]               = useState<ArchitectureResponse | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState<Set<NodeType>>(
    new Set(['agent', 'api_route', 'lib', 'external_service'])
  )
  const [search, setSearch]           = useState('')
  const [selectedNode, setSelectedNode] = useState<ArchNode | null>(null)
  const [lastVisit, setLastVisit]     = useState<number | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/architecture')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: ArchitectureResponse = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(LAST_VISIT_KEY)
    // First visit: no badge shown. Subsequent visits: badge on nodes modified since last visit.
    setLastVisit(stored ? parseInt(stored, 10) : null)
    localStorage.setItem(LAST_VISIT_KEY, Date.now().toString())
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!data) return

    const filteredArchNodes = data.nodes.filter((n) => {
      if (!activeFilters.has(n.type)) return false
      if (search && !n.label.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    const filteredIds = new Set(filteredArchNodes.map((n) => n.id))

    // Clear selected node if it's been filtered out
    setSelectedNode((prev) => (prev && !filteredIds.has(prev.id) ? null : prev))

    const filteredArchEdges = data.edges.filter(
      (e) => filteredIds.has(e.source) && filteredIds.has(e.target)
    )

    const rfNodes = toRFNodes(filteredArchNodes, lastVisit)
    const rfEdges = toRFEdges(filteredArchEdges)
    setNodes(applyDagreLayout(rfNodes, rfEdges))
    setEdges(rfEdges)
  }, [data, activeFilters, search, lastVisit, setNodes, setEdges])

  const updatedCount = useMemo(() => {
    if (!data || lastVisit === null) return 0
    return data.nodes.filter((n) => (n.meta.mtime ?? 0) > lastVisit).length
  }, [data, lastVisit])

  function toggleFilter(type: NodeType) {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  function handleNodeClick(_: React.MouseEvent, node: Node) {
    const archNode = data?.nodes.find((n) => n.id === node.id) ?? null
    setSelectedNode(archNode)
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1117' }}>
        <div style={{ color: '#64748b', fontSize: 14 }}>Analyse du codebase en cours…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f1117', gap: 12 }}>
        <div style={{ color: '#f87171', fontSize: 14 }}>Erreur : {error}</div>
        <button onClick={fetchData} style={{ padding: '8px 16px', background: '#2d3148', color: '#e2e8f0', border: '1px solid #3d4266', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
          Réessayer
        </button>
      </div>
    )
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1117' }}>
        <div style={{ color: '#64748b', fontSize: 14 }}>Aucun nœud trouvé.</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0f1117' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#1a1d27', borderBottom: '1px solid #2d3148', flexShrink: 0 }}>
        <span style={{ fontSize: 16 }}>🗺️</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Architecture Vanzon</span>
        <span style={{ fontSize: 11, background: '#23273a', color: '#94a3b8', padding: '2px 8px', borderRadius: 99 }}>
          {data.nodes.length} nœuds · {data.edges.length} connexions
        </span>
        <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>
          Analysé à {new Date(data.scannedAt).toLocaleTimeString('fr-FR')}
        </span>
        {updatedCount > 0 && (
          <span style={{ fontSize: 11, color: '#f97316' }}>🟠 {updatedCount} modifié{updatedCount > 1 ? 's' : ''}</span>
        )}
        <button onClick={fetchData} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, background: '#2d3148', color: '#94a3b8', border: '1px solid #3d4266', cursor: 'pointer' }}>
          ⟳ Re-scanner
        </button>
      </div>

      {/* Filterbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#13161f', borderBottom: '1px solid #1e2235', flexShrink: 0, flexWrap: 'wrap' }}>
        {FILTER_TYPES.map(({ label, type, color }) => (
          <button key={type} onClick={() => toggleFilter(type)} style={{
            fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 99,
            border: `1px solid ${color}44`,
            background: activeFilters.has(type) ? `${color}11` : 'transparent',
            color: activeFilters.has(type) ? color : '#4a5568',
            cursor: 'pointer',
          }}>
            ● {label} ({data.nodes.filter((n) => n.type === type).length})
          </button>
        ))}
        <div style={{ width: 1, height: 16, background: '#2d3148' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Rechercher un nœud…"
          style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: '#1a1d27', border: '1px solid #2d3148', color: '#e2e8f0', width: 200, outline: 'none' }}
        />
      </div>

      {/* Graph + panel */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            style={{ background: '#0f1117' }}
          >
            <Background color="#1e2235" gap={24} size={1} />
            <Controls style={{ background: '#1a1d27', border: '1px solid #2d3148' }} />
            <MiniMap
              style={{ background: '#1a1d27', border: '1px solid #2d3148' }}
              nodeColor={(n) => {
                const t = (n.data as ArchNode).type
                return { agent: '#f59e0b', api_route: '#60a5fa', lib: '#a78bfa', external_service: '#34d399' }[t] ?? '#64748b'
              }}
            />
          </ReactFlow>
        </div>
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            edges={data.edges}
            allNodes={data.nodes}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: aucune erreur TypeScript.

---

### Task 10: Créer la page Server Component

**Files:**
- Create: `src/app/admin/(protected)/architecture/page.tsx`

- [ ] **Step 1: Créer page.tsx**

```typescript
// src/app/admin/(protected)/architecture/page.tsx
import dynamic from 'next/dynamic'

// React Flow uses browser APIs — SSR must be disabled
const ArchitectureClient = dynamic(
  () => import('./ArchitectureClient').then((m) => ({ default: m.ArchitectureClient })),
  { ssr: false }
)

export const metadata = { title: 'Architecture — Admin Vanzon' }

export default function ArchitecturePage() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ArchitectureClient />
    </div>
  )
}
```

- [ ] **Step 2: Vérifier visuellement en dev**

Naviguer vers `http://localhost:3000/admin/architecture`.

Checklist de vérification :
- [ ] Le graphe s'affiche avec des nœuds colorés (agents=jaune, routes=bleu, libs=violet, services=vert)
- [ ] Les chips de filtre masquent/affichent les nœuds correspondants
- [ ] Masquer un type de nœud ferme le panneau si le nœud sélectionné est de ce type
- [ ] La recherche filtre les nœuds par label
- [ ] Cliquer sur un nœud ouvre le panneau de détail à droite
- [ ] Le bouton ✕ dans le panneau le ferme
- [ ] Le bouton "Re-scanner" refetch les données
- [ ] La section "Consommé par" du panneau (libs/services) affiche les consommateurs

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/(protected)/architecture/
git commit -m "feat(architecture): React Flow UI - graph + filters + detail panel"
```

---

## Chunk 3: Sidebar + Registry + Build final

### Task 11: Ajouter l'entrée dans la sidebar

**Files:**
- Modify: `src/app/admin/_components/AdminSidebar.tsx`

- [ ] **Step 1: Lire la sidebar pour trouver la section "Système"**

Chercher dans `src/app/admin/_components/AdminSidebar.tsx` le bloc contenant `label: "Système"` et l'entrée `href: "/admin/agents"`.

- [ ] **Step 2: Ajouter l'entrée Architecture après "Agents IA"**

Dans le tableau `items` du groupe `Système`, après l'entrée `href: "/admin/agents"`, insérer :

```typescript
{
  label: "Architecture",
  href: "/admin/architecture",
  icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-shrink-0">
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3zM10 6.5h4M6.5 10v4M17.5 10v4M10 17.5h4" />
    </svg>
  ),
},
```

> Note : le SVG utilise `className` avec les classes Tailwind `w-[18px] h-[18px] flex-shrink-0` et `strokeWidth="1.8"` pour correspondre exactement au style des autres icônes de la sidebar.

- [ ] **Step 3: Vérifier visuellement**

Naviguer vers n'importe quelle page admin → vérifier que "Architecture" apparaît dans la sidebar groupe Système, aligné avec les autres entrées.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/_components/AdminSidebar.tsx
git commit -m "feat(architecture): add Architecture entry in admin sidebar"
```

---

### Task 12: Ajouter le champ `routes` dans registry.json

**Files:**
- Modify: `scripts/agents/registry.json`

Le champ `routes` est optionnel. Il déclare les routes Next.js internes (chemin relatif à `src/app/api/`) qu'un agent appelle directement — créant ainsi des arêtes agent→route dans le graphe.

- [ ] **Step 1: Identifier les agents qui appellent des routes API internes**

```bash
grep -rn "localhost:3000\|fetch.*\/api\/" scripts/agents/ --include="*.ts"
```

- [ ] **Step 2: Ajouter le champ `routes` uniquement pour les agents confirmés**

Pour chaque agent détecté à l'étape 1, ajouter dans son entrée registry.json (dans le bon objet JSON) :

```json
"routes": ["<chemin-relatif-à-src/app/api>"]
```

Exemple : si `road-trip-publisher-agent.ts` appelle `/api/admin/road-trip-articles/publish`, ajouter :
```json
"routes": ["admin/road-trip-articles/publish"]
```

Si aucun appel interne n'est détecté, ne pas modifier le registry.

- [ ] **Step 3: Commit uniquement si des modifications ont été faites**

```bash
git diff --quiet scripts/agents/registry.json || (git add scripts/agents/registry.json && git commit -m "feat(architecture): add routes field in registry.json for agent→route edges")
```

---

### Task 13: Build de vérification final

- [ ] **Step 1: Lancer le build de production**

```bash
npm run build 2>&1 | tail -30
```
Expected: `✓ Compiled successfully` sans erreurs TypeScript ni ESLint.

- [ ] **Step 2: Vérifier que `.superpowers/` est dans .gitignore**

```bash
grep "superpowers" .gitignore
```
Si absent :
```bash
echo ".superpowers/" >> .gitignore
git add .gitignore
git commit -m "chore: add .superpowers/ to .gitignore"
```

- [ ] **Step 3: Push**

```bash
git push
```
