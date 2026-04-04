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

// ── Zod schema ──────────────────────────────────────────────────────────────────
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
    .min(1, { message: 'Choisissez au moins un intérêt' })
    .max(7),
  style_voyage: z.enum(['lent', 'explorer', 'aventure']),
  periode: z.enum(MOIS_OPTIONS),
  profil_voyageur: z.enum(['solo', 'couple', 'famille', 'amis']),
  budget: z.enum(['economique', 'confort', 'premium']),
  experience_van: z.boolean(),
})

type FormData = z.infer<typeof schema>

const STEP_FIELDS: Record<number, (keyof FormData)[]> = {
  1: ['prenom', 'email', 'region', 'duree'],
  2: ['interets', 'style_voyage', 'periode'],
  3: ['profil_voyageur', 'budget', 'experience_van'],
}

const variants = {
  enter: { x: 50, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 },
}

const inputClass =
  'bg-white border border-slate-200 focus:ring-blue-200 focus:border-blue-400 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 transition-colors placeholder:text-slate-400 text-slate-900 text-sm'

const labelClass = 'text-sm font-semibold text-slate-900'
const errorClass = 'text-rose-500 text-sm mt-1'

function radioCardClass(selected: boolean) {
  return [
    'cursor-pointer border rounded-xl p-4 transition-all duration-200 text-left',
    selected
      ? 'border-blue-400 bg-blue-50 shadow-sm'
      : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-300',
  ].join(' ')
}

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

  const handleNext = async () => {
    const valid = await trigger(STEP_FIELDS[step] as (keyof FormData)[])
    if (valid) setStep((s) => s + 1)
  }

  const handleBack = () => setStep((s) => s - 1)

  const toggleInteret = (value: InteretValue) => {
    const current = watch('interets') as InteretValue[]
    const exists = current.includes(value)
    setValue(
      'interets',
      exists ? current.filter((v) => v !== value) : [...current, value]
    )
  }

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

      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string }
        setErrorMessage(json.error ?? 'Une erreur est survenue, réessayez dans quelques instants.')
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
                setErrorMessage(event.message ?? 'Erreur interne, réessayez dans quelques instants.')
                setStatus('error')
                return
              }
            } catch {
              // ignore malformed SSE lines
            }
          }
        }
      }

      if (!receivedTerminalEvent) {
        setErrorMessage(
          'La connexion a été interrompue. Vérifiez votre boîte mail — votre road trip est peut-être arrivé !'
        )
        setStatus('error')
      }
    } catch {
      setErrorMessage('Une erreur réseau est survenue. Vérifiez votre connexion et réessayez.')
      setStatus('error')
    }
  }

  const progressPercent = (step / 4) * 100

  // ── Streaming state ──────────────────────────────────────────────────────────
  if (status === 'streaming') {
    return (
      <div className="py-2">
        <p className="text-sm text-center mb-5 font-medium text-slate-500">
          Construction de votre road trip sur mesure...
        </p>
        <RoadTripTerminal lines={terminalLines} />
      </div>
    )
  }

  // ── Success state ────────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="p-8 flex flex-col items-center justify-center gap-6 min-h-[320px] text-center"
      >
        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-4xl">
          🚐
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            C&apos;est parti !
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Votre road trip arrive dans votre boîte mail !<br />
            Vérifiez aussi vos spams si besoin.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Email envoyé avec succès
        </div>
      </motion.div>
    )
  }

  // ── Main form ────────────────────────────────────────────────────────────────
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
          <span className="text-sm font-medium text-slate-500">
            Étape {step} sur 4
          </span>
          <span className="text-sm font-medium text-accent-blue">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Steps */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {/* ── Step 1 ── */}
          {step === 1 && (
            <motion.div
              key={1}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Votre van trip
              </h2>

              <div className="space-y-5">
                <div>
                  <label htmlFor="field-prenom" className={labelClass}>Votre prénom</label>
                  <input
                    {...register('prenom')}
                    id="field-prenom"
                    type="text"
                    placeholder="Ex : Marie"
                    className={`${inputClass} mt-1.5`}
                  />
                  {errors.prenom && <p className={errorClass}>{errors.prenom.message}</p>}
                </div>

                <div>
                  <label htmlFor="field-email" className={labelClass}>Votre email</label>
                  <input
                    {...register('email')}
                    id="field-email"
                    type="email"
                    placeholder="marie@example.com"
                    className={`${inputClass} mt-1.5`}
                  />
                  {errors.email && <p className={errorClass}>{errors.email.message}</p>}
                </div>

                <div>
                  <label htmlFor="field-region" className={labelClass}>Région souhaitée</label>
                  <input
                    {...register('region')}
                    id="field-region"
                    type="text"
                    placeholder="Ex : Pays Basque, Bretagne, Provence..."
                    className={`${inputClass} mt-1.5`}
                  />
                  {errors.region && <p className={errorClass}>{errors.region.message}</p>}
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
                  {errors.duree && <p className={errorClass}>{errors.duree.message}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <motion.div
              key={2}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Vos envies
              </h2>

              <div className="space-y-6">
                <div>
                  <label className={labelClass}>
                    Vos centres d&apos;intérêt{' '}
                    <span className="font-normal text-slate-400">(plusieurs choix possibles)</span>
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
                              ? 'border-blue-400 bg-blue-50 text-blue-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                          ].join(' ')}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                  {errors.interets && <p className={errorClass}>{errors.interets.message}</p>}
                </div>

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
                        <p className="font-semibold text-sm text-slate-900">{opt.label}</p>
                        <p className="text-xs mt-0.5 text-slate-400">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                  {errors.style_voyage && <p className={errorClass}>{errors.style_voyage.message}</p>}
                </div>

                <div>
                  <label className={labelClass}>Période de voyage</label>
                  <select {...register('periode')} className={`${inputClass} mt-1.5`}>
                    {MOIS_OPTIONS.map((mois) => (
                      <option key={mois} value={mois}>
                        {MOIS_LABELS[mois] ?? mois}
                      </option>
                    ))}
                  </select>
                  {errors.periode && <p className={errorClass}>{errors.periode.message}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <motion.div
              key={3}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Votre profil
              </h2>

              <div className="space-y-6">
                <div>
                  <label className={labelClass}>Vous voyagez...</label>
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
                        <span className="text-sm font-semibold text-slate-900">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                  {errors.profil_voyageur && <p className={errorClass}>{errors.profil_voyageur.message}</p>}
                </div>

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
                        <p className="font-semibold text-sm text-slate-900">{opt.label}</p>
                        <p className="text-xs mt-0.5 text-slate-400">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                  {errors.budget && <p className={errorClass}>{errors.budget.message}</p>}
                </div>

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
                          ? 'border-blue-400 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      Première fois
                    </button>
                    <button
                      type="button"
                      aria-pressed={selectedExperience}
                      onClick={() => setValue('experience_van', true)}
                      className={[
                        'flex-1 py-3 rounded-xl border text-sm font-medium transition-all duration-200',
                        selectedExperience
                          ? 'border-blue-400 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      Habitué(e)
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
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Confirmation
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Vérifiez vos informations avant de générer votre road trip.
              </p>

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
                <div className="col-span-2 rounded-xl p-3 bg-slate-50 border border-slate-200">
                  <p className="text-xs mb-1.5 font-medium uppercase tracking-wide text-slate-400">
                    Intérêts
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(watch('interets') as InteretValue[]).map((v) => (
                      <span
                        key={v}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        {INTERETS_OPTIONS.find((o) => o.value === v)?.label ?? v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {status === 'error' && (
                <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex flex-col gap-3">
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

              {status !== 'error' && (
                <button
                  type="submit"
                  className="btn-primary w-full text-base py-3.5 rounded-xl font-semibold text-white"
                >
                  Générer mon road trip
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        {step < 4 && (
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                Retour
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary flex-1 py-3 rounded-xl text-sm font-semibold text-white"
            >
              Suivant
            </button>
          </div>
        )}
        {step === 4 && (
          <button
            type="button"
            onClick={handleBack}
            className="w-full mt-3 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Modifier
          </button>
        )}
      </form>
    </div>
  )
}

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
    <div className="rounded-xl p-3 bg-slate-50 border border-slate-200">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-0.5">
        {label}
      </p>
      <p className={`text-sm font-semibold text-slate-900 ${truncate ? 'truncate' : ''}`}>
        {value}
      </p>
    </div>
  )
}
