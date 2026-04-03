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
  const nodeData = data as unknown as ArchNodeData & { isUpdated?: boolean }
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
