'use client'

import { useState, useTransition } from 'react'

export function ContactedToggle({
  id,
  initial,
}: {
  id: string
  initial: boolean
}) {
  const [contacted, setContacted] = useState(initial)
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    const next = !contacted
    setContacted(next) // optimistic
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/road-trips/toggle-contacted', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, contacted: next }),
        })
        if (!res.ok) throw new Error('update failed')
      } catch {
        setContacted(!next) // rollback
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={contacted}
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all',
        contacted
          ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200'
          : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200',
        pending ? 'opacity-50 cursor-wait' : 'cursor-pointer',
      ].join(' ')}
    >
      <span className="w-2 h-2 rounded-full" style={{ background: contacted ? '#16A34A' : '#94A3B8' }} />
      {contacted ? 'Contacté' : 'À contacter'}
    </button>
  )
}
