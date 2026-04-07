'use client'

import { useEffect, useRef, useState } from 'react'

export interface TerminalLine {
  id: string
  text: string
  done: boolean
}

export function RoadTripTerminal({ lines }: { lines: TerminalLine[] }) {
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  return (
    <div
      className="rounded-2xl overflow-hidden border border-slate-200"
      style={{
        background: '#0F172A',
        boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
        minHeight: 260,
        fontFamily: "'DM Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace",
      }}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <span className="w-3 h-3 rounded-full block" style={{ background: '#FF5F57' }} />
        <span className="w-3 h-3 rounded-full block" style={{ background: '#FEBC2E' }} />
        <span className="w-3 h-3 rounded-full block" style={{ background: '#28C840' }} />
        <span className="ml-3 text-xs text-slate-500">
          vanzon-explorer — génération en cours
        </span>
      </div>

      {/* Body */}
      <div ref={bodyRef} className="px-5 py-5 space-y-2.5" style={{ maxHeight: 320, overflowY: 'auto' }}>
        <div className="text-xs mb-4 text-slate-600">
          $ vanzon generate --personalized
        </div>

        {lines.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <BlinkingCursor />
          </div>
        )}

        {lines.map((line) =>
          line.done ? (
            <DoneLine key={line.id} text={line.text} />
          ) : (
            <ActiveLine key={line.id} text={line.text} />
          )
        )}
      </div>
    </div>
  )
}

function DoneLine({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 text-sm leading-relaxed text-slate-400">
      <span className="flex-shrink-0 font-bold text-green-400">
        ✓
      </span>
      <span>{text}</span>
    </div>
  )
}

function ActiveLine({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('')
  const counterRef = useRef(0)

  useEffect(() => {
    counterRef.current = 0
    setDisplayed('')

    const interval = setInterval(() => {
      if (counterRef.current < text.length) {
        counterRef.current++
        setDisplayed(text.slice(0, counterRef.current))
      } else {
        clearInterval(interval)
      }
    }, 20)

    return () => clearInterval(interval)
  }, [text])

  return (
    <div className="flex items-start gap-3 text-sm leading-relaxed text-blue-400">
      <span className="flex-shrink-0 text-blue-500">▶</span>
      <span>
        {displayed}
        <BlinkingCursor />
      </span>
    </div>
  )
}

function BlinkingCursor() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => setVisible((v) => !v), 520)
    return () => clearInterval(interval)
  }, [])

  return (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 13,
        marginLeft: 2,
        verticalAlign: 'text-bottom',
        borderRadius: 1,
        background: visible ? '#3B82F6' : 'transparent',
        transition: 'background 0.1s',
      }}
    />
  )
}
