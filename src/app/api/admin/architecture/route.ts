import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { scanAgents, scanApiRoutes, scanLibs, scanExternalServices, buildLibServiceEdges } from './scanners'
import { ArchNode, ArchEdge, ArchitectureResponse } from './types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
