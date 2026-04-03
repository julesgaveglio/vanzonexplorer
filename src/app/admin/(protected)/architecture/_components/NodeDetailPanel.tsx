'use client'

import React from 'react'
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
