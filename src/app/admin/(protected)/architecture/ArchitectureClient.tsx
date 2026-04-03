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
    new Set<NodeType>(['agent', 'api_route', 'lib', 'external_service'])
  )
  const [search, setSearch]           = useState('')
  const [selectedNode, setSelectedNode] = useState<ArchNode | null>(null)
  const [lastVisit, setLastVisit]     = useState<number | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

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
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  function handleNodeClick(_: React.MouseEvent, node: Node) {
    const archNode = data?.nodes.find((n) => n.id === node.id) ?? null
    setSelectedNode((prev) => (prev?.id === node.id ? null : archNode))
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
style={{ background: '#0f1117' }}
          >
            <Background color="#1e2235" gap={24} size={1} />
            <Controls style={{ background: '#1a1d27', border: '1px solid #2d3148' }} />
            <MiniMap
              style={{ background: '#1a1d27', border: '1px solid #2d3148' }}
              nodeColor={(n) => {
                const t = (n.data as unknown as ArchNode).type
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
