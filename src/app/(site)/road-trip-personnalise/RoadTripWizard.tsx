'use client'

import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  INTERETS_OPTIONS,
  MOIS_OPTIONS,
  STYLE_VOYAGE_OPTIONS,
  PROFIL_VOYAGEUR_OPTIONS,
  BUDGET_OPTIONS,
  DUREE_OPTIONS,
} from '@/lib/road-trip/constants'
import type { InteretValue } from '@/lib/road-trip/constants'
import { RoadTripTerminal, type TerminalLine } from './RoadTripTerminal'

// ── Zod schema (mirrors API route exactly) ────────────────────────────────────
const InteretEnum = z.enum(
  INTERETS_OPTIONS.map((o) => o.value) as [string, ...string[]]
)

const schema = z.object({
  prenom: z.string().min(2, { message: 'Minimum 2 caractères' }).max(50),
  email: z.string().email({ message: 'Email invalide' }),
  region: z.string().min(2, { message: 'Minimum 2 caractères' }).max(100),
  duree: z.number().int().min(1).max(14),
  interets: z
    .array(InteretEnum)
    .min(1, { message: 'Choisis au moins un intérêt' })
    .max(7),
  style_voyage: z.enum(['lent', 'explorer', 'aventure']),
  periode: z.enum(MOIS_OPTIONS),
  profil_voyageur: z.enum(['solo', 'couple', 'famille', 'amis']),
  budget: z.enum(['economique', 'confort', 'premium']),
  experience_van: z.boolean(),
})

type FormData = z.infer<typeof schema>

// ── Step field mapping ────────────────────────────────────────────────────────
const STEP_FIELDS: Record<number, (keyof FormData)[]> = {
  1: ['prenom', 'email', 'region', 'duree'],
  2: ['interets', 'style_voyage', 'periode'],
  3: ['profil_voyageur', 'budget', 'experience_van'],
}

// ── Animation variants ────────────────────────────────────────────────────────
const variants = {
  enter: { x: 50, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 },
}

// ── Shared input class ────────────────────────────────────────────────────────
const inputClass =
  'bg-white/75 border border-teal-200 focus:ring-teal-300 focus:border-teal-400 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 transition-colors placeholder:text-[#5a9090] text-[#0f3535] text-sm'

const labelClass = 'text-sm font-semibold text-[#0f3535]'
const errorClass = 'text-rose-500 text-sm mt-1'

// ── Radio card classes ────────────────────────────────────────────────────────
function radioCardClass(selected: boolean) {
  return [
    'cursor-pointer border rounded-xl p-4 transition-all duration-200 text-left',
    selected
      ? 'border-[#72b9bb] bg-[#72b9bb]/[0.12] shadow-sm'
      : 'border-white/60 bg-white/50 hover:bg-white/70 hover:border-[#72b9bb]/60',
  ].join(' ')
}

// ── Mois label helper ─────────────────────────────────────────────────────────
const MOIS_LABELS: Record<string, string> = {
  janvier: 'Janvier',
  fevrier: 'Février',
  mars: 'Mars',
  avril: 'Avril',
  mai: 'Mai',
  juin: 'Juin',
  juillet: 'Juillet',
  aout: 'Août',
  septembre: 'Septembre',
  octobre: 'Octobre',
  novembre: 'Novembre',
  decembre: 'Décembre',
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function RoadTripWizard() {
  const [step, setStep] = useState(1)
  const [status, setStatus] = useState<'idle' | 'streaming' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([])

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      prenom: '',
      email: '',
      region: '',
      duree: 7,
      interets: [],
      style_voyage: 'explorer',
      periode: 'juillet',
      profil_voyageur: 'couple',
      budget: 'confort',
      experience_van: false,
    },
  })

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleNext = async () => {
    const valid = await trigger(STEP_FIELDS[step] as (keyof FormData)[])
    if (valid) setStep((s) => s + 1)
  }

  const handleBack = () => setStep((s) => s - 1)

  // ── Interets toggle ────────────────────────────────────────────────────────
  const toggleInteret = (value: InteretValue) => {
    const current = watch('interets') as InteretValue[]
    const exists = current.includes(value)
    setValue(
      'interets',
      exists ? current.filter((v) => v !== value) : [...current, value]
    )
  }

  // ── Submit (streaming) ─────────────────────────────────────────────────────
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setStatus('streaming')
    setTerminalLines([])

    let lineCounter = 0
    const addLine = (text: string) => {
      const id = String(++lineCounter)
      setTerminalLines((prev) => [
        ...prev.map((l) => ({ ...l, done: true })),
        { id, text, done: false },
      ])
    }

    let receivedTerminalEvent = false

    try {
      const res = await fetch('/api/road-trip/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      // Non-2xx → pre-flight error (returned as JSON)
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string }
        setErrorMessage(json.error ?? 'Une erreur est survenue, réessaie dans quelques instants.')
        setStatus('error')
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setErrorMessage('Réponse inattendue du serveur.')
        setStatus('error')
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          for (const raw of part.split('\n')) {
            if (!raw.startsWith('data: ')) continue
            try {
              const event = JSON.parse(raw.slice(6)) as {
                type: string
                message?: string
              }

              if (event.type === 'progress' && event.message) {
                addLine(event.message)
              } else if (event.type === 'done') {
                receivedTerminalEvent = true
                setTerminalLines((prev) => prev.map((l) => ({ ...l, done: true })))
                setTimeout(() => setStatus('success'), 1000)
                return
              } else if (event.type === 'error') {
                receivedTerminalEvent = true
                setErrorMessage(event.message ?? 'Erreur interne, réessaie dans quelques instants.')
                setStatus('error')
                return
              }
            } catch {
              // ignore malformed SSE lines
            }
          }
        }
      }

      // Stream closed without a terminal event (timeout, disconnection, etc.)
      if (!receivedTerminalEvent) {
        setErrorMessage(
          'La connexion a été interrompue. Vérifie ta boîte mail — ton road trip est peut-être arrivé !'
        )
        setStatus('error')
      }
    } catch {
      setErrorMessage('Une erreur réseau est survenue. Vérifie ta connexion et réessaie.')
      setStatus('error')
    }
  }

  // ── Progress bar ───────────────────────────────────────────────────────────
  const progressPercent = (step / 4) * 100

  // ── Streaming / terminal state ─────────────────────────────────────────────
  if (status === 'streaming') {
    return (
      <div className="py-2">
        <p className="text-sm text-center mb-5 font-medium" style={{ color: '#5a9090' }}>
          On construit ton road trip sur mesure… 🚐
        </p>
        <RoadTripTerminal lines={terminalLines} />
      </div>
    )
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="p-8 flex flex-col items-center justify-center gap-6 min-h-[320px] text-center"
      >
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ background: 'rgba(114,185,187,0.15)' }}>
          🚐
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-2" style={{ color: '#0f3535' }}>
            C&apos;est parti !
          </h3>
          <p className="max-w-sm mx-auto" style={{ color: '#2d6b6b' }}>
            Ton road trip arrive dans ta boîte mail !<br />
            Vérifie aussi tes spams si besoin.
          </p>
        </div>
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border"
          style={{ background: 'rgba(114,185,187,0.15)', color: '#1a5c5c', borderColor: 'rgba(114,185,187,0.30)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Email envoyé avec succès
        </div>
      </motion.div>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  const values = watch()
  const selectedInterets = watch('interets') as InteretValue[]
  const selectedStyle = watch('style_voyage')
  const selectedProfil = watch('profil_voyageur')
  const selectedBudget = watch('budget')
  const selectedExperience = watch('experience_van')

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: '#5a9090' }}>
            Étape {step} sur 4
          </span>
          <span className="text-sm font-medium" style={{ color: '#2a8080' }}>
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.40)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #72b9bb 0%, #8cc5b8 100%)' }}
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Steps */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {/* ── Step 1: Ton van trip ── */}
          {step === 1 && (
            <motion.div
              key={1}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <h2 className="text-xl font-bold mb-6" style={{ color: '#0f3535' }}>
                Ton van trip 🗺️
              </h2>

              <div className="space-y-5">
                <div>
                  <label htmlFor="field-prenom" className={labelClass}>Ton prénom</label>
                  <input
                    {...register('prenom')}
                    id="field-prenom"
                    type="text"
                    placeholder="Ex : Marie"
                    className={`${inputClass} mt-1.5`}
                  />
                  {errors.prenom && (
                    <p className={errorClass}>{errors.prenom.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="field-email" className={labelClass}>Ton email</label>
                  <input
                    {...register('email')}
                    id="field-email"
                    type="email"
                    placeholder="marie@example.com"
                    className={`${inputClass} mt-1.5`}
                  />
                  {errors.email && (
                    <p className={errorClass}>{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="field-region" className={labelClass}>
                    Région souhaitée
                  </label>
                  <input
                    {...register('region')}
                    id="field-region"
                    type="text"
                    placeholder="Ex : Pays Basque, Bretagne, Provence…"
                    className={`${inputClass} mt-1.5`}
                  />
                  {errors.region && (
                    <p className={errorClass}>{errors.region.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="field-duree" className={labelClass}>Durée du voyage</label>
                  <select {...register('duree', { valueAsNumber: true })} id="field-duree" className={`${inputClass} mt-1.5`}>
                    {DUREE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n} jour{n > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                  {errors.duree && (
                    <p className={errorClass}>{errors.duree.message}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Tes envies ── */}
          {step === 2 && (
            <motion.div
              key={2}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <h2 className="text-xl font-bold mb-6" style={{ color: '#0f3535' }}>
                Tes envies ✨
              </h2>

              <div className="space-y-6">
                {/* Interets */}
                <div>
                  <label className={labelClass}>
                    Tes centres d&apos;intérêt{' '}
                    <span className="font-normal" style={{ color: '#5a9090' }}>(plusieurs choix possibles)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {INTERETS_OPTIONS.map((opt) => {
                      const selected = selectedInterets.includes(opt.value as InteretValue)
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleInteret(opt.value as InteretValue)}
                          className={[
                            'px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 text-left',
                            selected
                              ? 'border-[#72b9bb] bg-[#72b9bb]/[0.12] text-[#1a5c5c]'
                              : 'border-white/60 bg-white/50 text-[#2d6b6b] hover:bg-white/70',
                          ].join(' ')}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                  {errors.interets && (
                    <p className={errorClass}>{errors.interets.message}</p>
                  )}
                </div>

                {/* Style voyage */}
                <div>
                  <label className={labelClass}>Style de voyage</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    {STYLE_VOYAGE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={selectedStyle === opt.value}
                        onClick={() => setValue('style_voyage', opt.value)}
                        className={radioCardClass(selectedStyle === opt.value)}
                      >
                        <p className="font-semibold text-sm" style={{ color: '#0f3535' }}>
                          {opt.label}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#5a9090' }}>{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                  {errors.style_voyage && (
                    <p className={errorClass}>{errors.style_voyage.message}</p>
                  )}
                </div>

                {/* Periode */}
                <div>
                  <label className={labelClass}>Période de voyage</label>
                  <select
                    {...register('periode')}
                    className={`${inputClass} mt-1.5`}
                  >
                    {MOIS_OPTIONS.map((mois) => (
                      <option key={mois} value={mois}>
                        {MOIS_LABELS[mois] ?? mois}
                      </option>
                    ))}
                  </select>
                  {errors.periode && (
                    <p className={errorClass}>{errors.periode.message}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Ton profil ── */}
          {step === 3 && (
            <motion.div
              key={3}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <h2 className="text-xl font-bold mb-6" style={{ color: '#0f3535' }}>
                Ton profil 👤
              </h2>

              <div className="space-y-6">
                {/* Profil voyageur */}
                <div>
                  <label className={labelClass}>Tu voyages…</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    {PROFIL_VOYAGEUR_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={selectedProfil === opt.value}
                        onClick={() => setValue('profil_voyageur', opt.value)}
                        className={[
                          radioCardClass(selectedProfil === opt.value),
                          'text-center items-center flex flex-col gap-1',
                        ].join(' ')}
                      >
                        <span className="text-2xl">{opt.emoji}</span>
                        <span className="text-sm font-semibold" style={{ color: '#0f3535' }}>
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  {errors.profil_voyageur && (
                    <p className={errorClass}>{errors.profil_voyageur.message}</p>
                  )}
                </div>

                {/* Budget */}
                <div>
                  <label className={labelClass}>Budget hébergement</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    {BUDGET_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={selectedBudget === opt.value}
                        onClick={() => setValue('budget', opt.value)}
                        className={radioCardClass(selectedBudget === opt.value)}
                      >
                        <p className="font-semibold text-sm" style={{ color: '#0f3535' }}>
                          {opt.label}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#5a9090' }}>{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                  {errors.budget && (
                    <p className={errorClass}>{errors.budget.message}</p>
                  )}
                </div>

                {/* Experience van */}
                <div>
                  <label className={labelClass}>Expérience en van</label>
                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      aria-pressed={!selectedExperience}
                      onClick={() => setValue('experience_van', false)}
                      className={[
                        'flex-1 py-3 rounded-xl border text-sm font-medium transition-all duration-200',
                        !selectedExperience
                          ? 'border-[#72b9bb] bg-[#72b9bb]/[0.12] text-[#1a5c5c]'
                          : 'border-white/60 bg-white/50 text-[#2d6b6b] hover:bg-white/70',
                      ].join(' ')}
                    >
                      🌱 Première fois
                    </button>
                    <button
                      type="button"
                      aria-pressed={selectedExperience}
                      onClick={() => setValue('experience_van', true)}
                      className={[
                        'flex-1 py-3 rounded-xl border text-sm font-medium transition-all duration-200',
                        selectedExperience
                          ? 'border-[#72b9bb] bg-[#72b9bb]/[0.12] text-[#1a5c5c]'
                          : 'border-white/60 bg-white/50 text-[#2d6b6b] hover:bg-white/70',
                      ].join(' ')}
                    >
                      🚐 Habitué(e)
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 4: Confirmation ── */}
          {step === 4 && (
            <motion.div
              key={4}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <h2 className="text-xl font-bold mb-2" style={{ color: '#0f3535' }}>
                Confirmation 🎯
              </h2>
              <p className="text-sm mb-6" style={{ color: '#5a9090' }}>
                Vérifie tes informations avant de générer ton road trip.
              </p>

              {/* Recap grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <RecapCard label="Prénom" value={values.prenom} />
                <RecapCard label="Email" value={values.email} truncate />
                <RecapCard label="Région" value={values.region} />
                <RecapCard
                  label="Durée"
                  value={`${values.duree} jour${values.duree > 1 ? 's' : ''}`}
                />
                <RecapCard
                  label="Période"
                  value={MOIS_LABELS[values.periode] ?? values.periode}
                />
                <RecapCard
                  label="Style"
                  value={
                    STYLE_VOYAGE_OPTIONS.find((o) => o.value === values.style_voyage)?.label ??
                    values.style_voyage
                  }
                />
                <RecapCard
                  label="Profil"
                  value={
                    PROFIL_VOYAGEUR_OPTIONS.find((o) => o.value === values.profil_voyageur)?.label ??
                    values.profil_voyageur
                  }
                />
                <RecapCard
                  label="Budget"
                  value={
                    BUDGET_OPTIONS.find((o) => o.value === values.budget)?.label ?? values.budget
                  }
                />
                <RecapCard
                  label="Expérience"
                  value={values.experience_van ? 'Habitué(e)' : 'Première fois'}
                />
                <div className="col-span-2 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.60)' }}>
                  <p className="text-xs mb-1.5 font-medium uppercase tracking-wide" style={{ color: '#5a9090' }}>
                    Intérêts
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(watch('interets') as InteretValue[]).map((v) => (
                      <span
                        key={v}
                        className="px-2.5 py-1 rounded-full text-xs font-medium border"
                        style={{
                          background: 'rgba(114,185,187,0.12)',
                          color: '#1a5c5c',
                          borderColor: 'rgba(114,185,187,0.25)',
                        }}
                      >
                        {INTERETS_OPTIONS.find((o) => o.value === v)?.label ?? v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Error message (from streaming failure) */}
              {status === 'error' && (
                <div className="mb-4 p-4 rounded-xl text-red-600 text-sm flex flex-col gap-3" style={{ background: 'rgba(254,242,242,0.70)', border: '1px solid rgba(254,202,202,0.60)' }}>
                  <p>{errorMessage}</p>
                  <button
                    type="button"
                    onClick={() => setStatus('idle')}
                    className="self-start text-sm px-4 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-100 transition-colors"
                  >
                    Réessayer
                  </button>
                </div>
              )}

              {/* Submit button */}
              {status !== 'error' && (
                <button
                  type="submit"
                  className="w-full text-base py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: '#2a8080' }}
                >
                  Générer mon road trip 🚐
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        {step < 4 && (
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 rounded-xl border text-sm font-medium transition-colors"
                style={{ background: 'rgba(255,255,255,0.55)', borderColor: 'rgba(255,255,255,0.70)', color: '#2d6b6b' }}
              >
                ← Retour
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: '#2a8080' }}
            >
              Suivant →
            </button>
          </div>
        )}
        {step === 4 && (
          <button
            type="button"
            onClick={handleBack}
            className="w-full mt-3 py-3 rounded-xl border text-sm font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.55)', borderColor: 'rgba(255,255,255,0.70)', color: '#2d6b6b' }}
          >
            ← Modifier
          </button>
        )}
      </form>
    </div>
  )
}

// ── RecapCard subcomponent ────────────────────────────────────────────────────
function RecapCard({
  label,
  value,
  truncate = false,
}: {
  label: string
  value: string
  truncate?: boolean
}) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(114,185,187,0.30)' }}>
      <p className="text-xs font-medium uppercase tracking-wide mb-0.5" style={{ color: '#5a9090' }}>
        {label}
      </p>
      <p
        className={[
          'text-sm font-semibold',
          truncate ? 'truncate' : '',
        ].join(' ')}
        style={{ color: '#0f3535' }}
      >
        {value}
      </p>
    </div>
  )
}
