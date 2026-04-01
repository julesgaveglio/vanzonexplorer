'use client'

import { useEffect, useRef, useState } from 'react'

export interface TerminalLine {
  id: string
  text: string
  done: boolean
}

// ── Main terminal container ────────────────────────────────────────────────────
export function RoadTripTerminal({ lines }: { lines: TerminalLine[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom as lines appear
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(5, 20, 20, 0.97)',
        border: '1px solid rgba(114,185,187,0.18)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.50)',
        minHeight: 260,
        fontFamily: "'DM Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace",
      }}
    >
      {/* macOS-style title bar */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span className="w-3 h-3 rounded-full block" style={{ background: '#FF5F57' }} />
        <span className="w-3 h-3 rounded-full block" style={{ background: '#FEBC2E' }} />
        <span className="w-3 h-3 rounded-full block" style={{ background: '#28C840' }} />
        <span
          className="ml-3 text-xs"
          style={{ color: 'rgba(114,185,187,0.40)' }}
        >
          vanzon-explorer — génération en cours
        </span>
      </div>

      {/* Terminal body */}
      <div className="px-5 py-5 space-y-2.5" style={{ maxHeight: 320, overflowY: 'auto' }}>
        {/* Prompt line */}
        <div className="text-xs mb-4" style={{ color: 'rgba(114,185,187,0.30)' }}>
          $ vanzon generate --personalized
        </div>

        {lines.length === 0 && (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(114,185,187,0.35)' }}>
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
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

// ── Done line (with checkmark) ─────────────────────────────────────────────────
function DoneLine({ text }: { text: string }) {
  return (
    <div
      className="flex items-start gap-3 text-sm leading-relaxed"
      style={{ color: 'rgba(160,205,205,0.60)' }}
    >
      <span className="flex-shrink-0 font-bold" style={{ color: '#4ade80', letterSpacing: '-0.02em' }}>
        ✓
      </span>
      <span>{text}</span>
    </div>
  )
}

// ── Active line (typewriter in progress) ─────────────────────────────────────
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
    }, 20) // ~50 chars/sec

    return () => clearInterval(interval)
  }, [text])

  return (
    <div
      className="flex items-start gap-3 text-sm leading-relaxed"
      style={{ color: '#72b9bb' }}
    >
      <span className="flex-shrink-0" style={{ color: '#5a9090' }}>▶</span>
      <span>
        {displayed}
        <BlinkingCursor />
      </span>
    </div>
  )
}

// ── Blinking block cursor ──────────────────────────────────────────────────────
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
        background: visible ? '#72b9bb' : 'transparent',
        transition: 'background 0.1s',
      }}
    />
  )
}
