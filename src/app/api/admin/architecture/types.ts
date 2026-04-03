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
