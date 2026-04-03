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
        const libImportsIterator = content.matchAll(/from\s+['"](?:@\/|\.\.\/)*(?:src\/)?lib\/([\w-]+)/g)
        const libImports = Array.from(libImportsIterator)
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
  const services = Array.from(servicesSet)
  const nodes: ArchNode[] = services.map((name) => ({
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
      const collectTs = (dir: string) => {
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
