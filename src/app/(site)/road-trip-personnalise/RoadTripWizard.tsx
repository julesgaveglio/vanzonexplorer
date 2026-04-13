'use client'

import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { RoadTripTerminal, type TerminalLine } from './RoadTripTerminal'
import type {
  GroupType,
  VanStatus,
  DurationKey,
  InterestKey,
  BudgetLevel,
  OvernightPreference,
  RoadTripScope,
} from '@/types/roadtrip'
import { DURATION_SLUG_TO_KEY, type DurationSlug } from '@/types/road-trip-pb'

// ─── SVG icon helper ────────────────────────────────────────────────────────
const I = ({ d, cls }: { d: string; cls?: string }) => (
  <svg className={cls ?? 'w-6 h-6'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)

// ─── Options wizard ─────────────────────────────────────────────────────────
const GROUP_OPTIONS: { value: GroupType; label: string; icon: React.ReactNode }[] = [
  { value: 'solo', label: 'Solo', icon: <I d="M12 2a4 4 0 100 8 4 4 0 000-8zm0 10c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z" /> },
  { value: 'couple', label: 'En couple', icon: <I d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05C16.19 13.89 17 15.02 17 16.5V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /> },
  { value: 'amis', label: 'Entre amis', icon: <I d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /> },
  { value: 'famille', label: 'En famille', icon: <I d="M9 5a3 3 0 100 6 3 3 0 000-6zm7 1a2 2 0 100 4 2 2 0 000-4zM9 13c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm7 0c-.3 0-.64.02-1 .06C16.16 13.77 17 14.77 17 16v1h5v-2c0-1.46-2.5-2-3-2z" /> },
]

const VAN_STATUS_OPTIONS: {
  value: VanStatus
  title: string
  icon: React.ReactNode
}[] = [
  {
    value: 'proprietaire',
    title: 'Je suis propriétaire d\u2019un van',
    icon: <I d="M15 7h2a5 5 0 010 10h-2m-6-3a3 3 0 110-6 3 3 0 010 6zm-3 4v1a2 2 0 002 2h2a2 2 0 002-2v-1" cls="w-10 h-10" />,
  },
  {
    value: 'locataire',
    title: 'Je suis locataire',
    icon: <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="8" width="22" height="10" rx="3" /><path d="M5 8V6a2 2 0 012-2h6l4 4" /><circle cx="6.5" cy="18" r="2" /><circle cx="17.5" cy="18" r="2" /></svg>,
  },
]

const SCOPE_OPTIONS: {
  value: RoadTripScope
  label: string
  desc: string
  icon: React.ReactNode
}[] = [
  {
    value: 'france',
    label: 'Pays Basque français',
    desc: 'Biarritz, Bayonne, Espelette, Iraty...',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  },
  {
    value: 'france_espagne',
    label: 'Français + espagnol',
    desc: 'On inclut San Sebastián, Bilbao, Hondarribia...',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>,
  },
]

const DURATION_OPTIONS: { value: DurationKey; label: string }[] = [
  { value: '1j', label: '1 jour' },
  { value: '2-3j', label: '2-3 jours' },
  { value: '4-5j', label: '4-5 jours' },
  { value: '1sem', label: '1 semaine' },
]

const INTEREST_OPTIONS: { value: InterestKey; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'sport', label: 'Sport & Aventure', desc: 'surf, rafting, escalade, VTT', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM7 21l3-7 2.5 2V21M10 14l-2.5-3.5L11 7l5 5-3.5 2" /></svg> },
  { value: 'nature', label: 'Nature & Randonnée', desc: 'Rhune, Iraty, GR10', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 3L4 14h5l-1 7 9-11h-5l1-7z" /><path d="M3 21l5-7m4 7l4-5.5M17 21l4-7" opacity=".5" /></svg> },
  { value: 'gastronomie', label: 'Gastronomie Basque', desc: 'pintxos, restaurants, marchés', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zm2-5v3m4-3v3m4-3v3" /></svg> },
  { value: 'culture', label: 'Culture & Patrimoine', desc: 'Espelette, musées, villages', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v4m4-4v4m4-4v4" /></svg> },
  { value: 'plages', label: 'Plages & Détente', desc: 'Biarritz, Hendaye, Guéthary', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3" /><path d="M2 20c2-2 4-3 6-3s4 1 6 3c2-2 4-3 6-3" /><path d="M2 16c2-2 4-3 6-3s4 1 6 3c2-2 4-3 6-3" opacity=".4" /></svg> },
  { value: 'soirees', label: 'Soirées & Vie Locale', desc: 'bars, fêtes basques', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg> },
]

const BUDGET_OPTIONS: { value: BudgetLevel; label: string; desc: string }[] = [
  { value: 'faible', label: 'Économique', desc: '< 30€/pers/jour' },
  { value: 'moyen', label: 'Confort', desc: '30-80€/pers/jour' },
  { value: 'eleve', label: 'Premium', desc: '80€+/pers/jour' },
]

const OVERNIGHT_OPTIONS: {
  value: OvernightPreference
  label: string
  desc: string
  icon: React.ReactNode
}[] = [
  {
    value: 'gratuit',
    label: 'Parkings gratuits & spots sauvages',
    desc: 'Nuit en van tolérée, 0€',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12c0 1.1.9 2 2 2h14v-4" /><circle cx="18" cy="16" r="2" /></svg>,
  },
  {
    value: 'aires_officielles',
    label: 'Aires camping-car officielles',
    desc: 'Gratuit ou < 15€/nuit, services',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
  },
  {
    value: 'camping',
    label: 'Campings van-friendly',
    desc: '15-30€/nuit, confort',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20l9-16 9 16H3z" /><path d="M12 10v4" /></svg>,
  },
  {
    value: 'mix',
    label: 'Mix selon les étapes',
    desc: 'On alterne selon le trajet',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></svg>,
  },
]

// ─── Zod schema ─────────────────────────────────────────────────────────────
const schema = z.object({
  firstname: z.string().min(2, { message: 'Minimum 2 caractères' }).max(50),
  email: z.string().email({ message: 'Email invalide' }),
  groupType: z.enum(['solo', 'couple', 'amis', 'famille']),
  vanStatus: z.enum(['proprietaire', 'locataire']),
  scope: z.enum(['france', 'france_espagne']),
  duration: z.enum(['1j', '2-3j', '4-5j', '1sem']),
  interests: z
    .array(z.enum(['sport', 'nature', 'gastronomie', 'culture', 'plages', 'soirees']))
    .min(1, { message: 'Choisissez au moins un centre d\u2019intérêt' })
    .max(6),
  budgetLevel: z.enum(['faible', 'moyen', 'eleve']),
  overnightPreference: z.enum(['gratuit', 'aires_officielles', 'camping', 'mix']),
})

type FormData = z.infer<typeof schema>

// ─── Step validation map ─────────────────────────────────────────────────────
const STEP_FIELDS: Record<number, (keyof FormData)[]> = {
  1: ['firstname', 'email', 'groupType'],
  2: ['scope', 'duration', 'interests'],
  3: ['budgetLevel', 'overnightPreference'],
  4: ['vanStatus'],
}

const TOTAL_STEPS = 5

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
    'cursor-pointer border rounded-xl p-4 transition-all duration-200 text-left w-full min-h-[44px]',
    selected
      ? 'border-blue-400 bg-blue-50 shadow-sm'
      : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-300',
  ].join(' ')
}

export default function RoadTripWizard() {
  // ─── Pré-remplissage depuis searchParams (venant de /road-trip-pays-basque-van/*) ─
  const searchParams = useSearchParams()
  const prefillDurationSlug = searchParams.get('duration') as DurationSlug | null
  const prefillGroupType = searchParams.get('groupType') as GroupType | null
  const prefillBudgetLevel = searchParams.get('budgetLevel') as BudgetLevel | null

  const prefillDurationKey: DurationKey =
    prefillDurationSlug && DURATION_SLUG_TO_KEY[prefillDurationSlug]
      ? DURATION_SLUG_TO_KEY[prefillDurationSlug]
      : '2-3j'

  const hasAnyPrefill = Boolean(prefillDurationSlug || prefillGroupType || prefillBudgetLevel)
  // Si duration + groupType présents → step 3 (budget/overnight)
  // Si seulement l'un des deux → step 2
  // Sinon → step 1
  const initialStep =
    prefillDurationSlug && prefillGroupType ? 3 : hasAnyPrefill ? 2 : 1

  const [step, setStep] = useState(initialStep)
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
      firstname: '',
      email: '',
      groupType: prefillGroupType ?? 'couple',
      vanStatus: 'locataire',
      scope: 'france',
      duration: prefillDurationKey,
      interests: [],
      budgetLevel: prefillBudgetLevel ?? 'moyen',
      overnightPreference: 'mix',
    },
  })

  const handleNext = async () => {
    const fields = STEP_FIELDS[step]
    if (fields) {
      const valid = await trigger(fields)
      if (!valid) return
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }
  const handleBack = () => setStep((s) => Math.max(s - 1, 1))

  const toggleInterest = (value: InterestKey) => {
    const current = (watch('interests') ?? []) as InterestKey[]
    const exists = current.includes(value)
    setValue(
      'interests',
      exists ? current.filter((v) => v !== value) : [...current, value],
      { shouldValidate: true }
    )
  }

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setStatus('streaming')
    setTerminalLines([])

    let counter = 0
    const addLine = (text: string) => {
      const id = String(++counter)
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
        const json = (await res.json().catch(() => ({}))) as { error?: string }
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
              if (event.type === 'progress' && event.message) addLine(event.message)
              else if (event.type === 'done') {
                receivedTerminalEvent = true
                setTerminalLines((prev) => prev.map((l) => ({ ...l, done: true })))
                setTimeout(() => setStatus('success'), 1000)
                return
              } else if (event.type === 'error') {
                receivedTerminalEvent = true
                setErrorMessage(event.message ?? 'Erreur interne.')
                setStatus('error')
                return
              }
            } catch {
              /* ignore */
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

  const progressPercent = (step / TOTAL_STEPS) * 100

  // ─── Streaming state ─────────────────────────────────────────────────────
  if (status === 'streaming') {
    return (
      <div className="py-2">
        <p className="text-sm text-center mb-5 font-medium text-slate-500">
          Construction de votre road trip au Pays Basque...
        </p>
        <RoadTripTerminal lines={terminalLines} />
      </div>
    )
  }

  // ─── Success state ───────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="p-8 flex flex-col items-center justify-center gap-6 min-h-[320px] text-center"
      >
        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
          <svg className="w-10 h-10 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="8" width="22" height="10" rx="3" /><path d="M5 8V6a2 2 0 012-2h6l4 4" /><circle cx="6.5" cy="18" r="2" /><circle cx="17.5" cy="18" r="2" /></svg>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">C&apos;est parti !</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Votre road trip au Pays Basque arrive dans votre boîte mail !
            <br />
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

  // ─── Main form ───────────────────────────────────────────────────────────
  const values = watch()
  const selectedInterests = (watch('interests') ?? []) as InterestKey[]
  const selectedGroup = watch('groupType')
  const selectedVan = watch('vanStatus')
  const selectedScope = watch('scope')
  const selectedDuration = watch('duration')
  const selectedBudget = watch('budgetLevel')
  const selectedOvernight = watch('overnightPreference')

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-8">
        {hasAnyPrefill && (
          <div className="mb-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            ✓ Pré-rempli depuis la page road trip
          </div>
        )}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-500">
            Étape {step} sur {TOTAL_STEPS}
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

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {/* ─ Step 1 : Profil voyageur ─ */}
          {step === 1 && (
            <motion.div
              key={1}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">Votre profil voyageur</h2>
              <div className="space-y-5">
                <div>
                  <label htmlFor="field-firstname" className={labelClass}>Votre prénom</label>
                  <input
                    {...register('firstname')}
                    id="field-firstname"
                    type="text"
                    placeholder="Ex : Marie"
                    className={`${inputClass} mt-1.5`}
                  />
                  {errors.firstname && <p className={errorClass}>{errors.firstname.message}</p>}
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
                  <label className={labelClass}>Vous voyagez...</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    {GROUP_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={selectedGroup === opt.value}
                        onClick={() => setValue('groupType', opt.value)}
                        className={[
                          radioCardClass(selectedGroup === opt.value),
                          'text-center items-center flex flex-col gap-1',
                        ].join(' ')}
                      >
                        <span className="text-2xl">{opt.icon}</span>
                        <span className="text-sm font-semibold text-slate-900">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─ Step 2 : Situation van ─ */}
          {/* ─ Step 2 : Envies Pays Basque ─ */}
          {step === 2 && (
            <motion.div
              key={3}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">Vos envies au Pays Basque</h2>
              <div className="space-y-6">
                <div>
                  <label className={labelClass}>Périmètre du voyage</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {SCOPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={selectedScope === opt.value}
                        onClick={() => setValue('scope', opt.value)}
                        className={radioCardClass(selectedScope === opt.value)}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0">{opt.icon}</span>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{opt.label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Durée du voyage</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    {DURATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={selectedDuration === opt.value}
                        onClick={() => setValue('duration', opt.value)}
                        className={[
                          radioCardClass(selectedDuration === opt.value),
                          'text-center',
                        ].join(' ')}
                      >
                        <span className="text-sm font-semibold text-slate-900">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Centres d&apos;intérêt{' '}
                    <span className="font-normal text-slate-400">(plusieurs choix possibles)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {INTEREST_OPTIONS.map((opt) => {
                      const selected = selectedInterests.includes(opt.value)
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleInterest(opt.value)}
                          className={radioCardClass(selected)}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0">{opt.icon}</span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{opt.label}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {errors.interests && <p className={errorClass}>{errors.interests.message}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─ Step 3 : Budget & nuit van ─ */}
          {step === 3 && (
            <motion.div
              key={4}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">Votre budget & nuit en van</h2>
              <div className="space-y-6">
                <div>
                  <label className={labelClass}>Budget activités/repas par jour</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    {BUDGET_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={selectedBudget === opt.value}
                        onClick={() => setValue('budgetLevel', opt.value)}
                        className={radioCardClass(selectedBudget === opt.value)}
                      >
                        <p className="font-semibold text-sm text-slate-900">{opt.label}</p>
                        <p className="text-xs mt-0.5 text-slate-400">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Où souhaitez-vous dormir ?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {OVERNIGHT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={selectedOvernight === opt.value}
                        onClick={() => setValue('overnightPreference', opt.value)}
                        className={radioCardClass(selectedOvernight === opt.value)}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0">{opt.icon}</span>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{opt.label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─ Step 4 : Situation van ─ */}
          {step === 4 && (
            <motion.div
              key={4}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <h2 className="text-xl font-bold text-slate-900 mb-2">Votre situation van</h2>
              <p className="text-sm text-slate-500 mb-6">
                Cela nous permet d&apos;adapter les recommandations à votre situation.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {VAN_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={selectedVan === opt.value}
                    onClick={() => setValue('vanStatus', opt.value)}
                    className={[
                      radioCardClass(selectedVan === opt.value),
                      'flex flex-col items-center text-center gap-3 py-8',
                    ].join(' ')}
                  >
                    <span className="text-5xl">{opt.icon}</span>
                    <span className="text-base font-bold text-slate-900">{opt.title}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─ Step 5 : Récap + génération ─ */}
          {step === 5 && (
            <motion.div
              key={5}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <h2 className="text-xl font-bold text-slate-900 mb-2">Récapitulatif</h2>
              <p className="text-sm text-slate-500 mb-6">
                Vérifiez vos informations avant de générer votre road trip.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <RecapCard label="Prénom" value={values.firstname} />
                <RecapCard label="Email" value={values.email} truncate />
                <RecapCard
                  label="Groupe"
                  value={GROUP_OPTIONS.find((o) => o.value === values.groupType)?.label ?? values.groupType}
                />
                <RecapCard
                  label="Situation van"
                  value={
                    values.vanStatus === 'proprietaire' ? 'Propriétaire' : 'Locataire'
                  }
                />
                <RecapCard
                  label="Périmètre"
                  value={SCOPE_OPTIONS.find((o) => o.value === values.scope)?.label ?? values.scope}
                />
                <RecapCard
                  label="Durée"
                  value={DURATION_OPTIONS.find((o) => o.value === values.duration)?.label ?? values.duration}
                />
                <RecapCard
                  label="Budget"
                  value={BUDGET_OPTIONS.find((o) => o.value === values.budgetLevel)?.label ?? values.budgetLevel}
                />
                <div className="col-span-2 rounded-xl p-3 bg-slate-50 border border-slate-200">
                  <p className="text-xs mb-1.5 font-medium uppercase tracking-wide text-slate-400">
                    Centres d&apos;intérêt
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedInterests.map((v) => (
                      <span
                        key={v}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        {INTEREST_OPTIONS.find((o) => o.value === v)?.label ?? v}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="col-span-2 rounded-xl p-3 bg-purple-50 border border-purple-200">
                  <p className="text-xs mb-1.5 font-medium uppercase tracking-wide text-purple-600">
                    <svg className="inline w-3.5 h-3.5 mr-1 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
                    Nuit en van
                  </p>
                  <p className="text-sm font-semibold text-purple-900">
                    {OVERNIGHT_OPTIONS.find((o) => o.value === values.overnightPreference)?.label ??
                      values.overnightPreference}
                  </p>
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
                  Générer mon road trip au Pays Basque
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        {step < TOTAL_STEPS && (
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
              className="btn-primary flex-1 py-3 rounded-xl text-sm font-semibold text-white inline-flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z"/><path d="M19 15l1.04 3.13L23 19l-2.96.87L19 23l-1.04-3.13L15 19l2.96-.87z" opacity=".6"/></svg>
              Suivant
            </button>
          </div>
        )}
        {step === TOTAL_STEPS && (
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
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-0.5">{label}</p>
      <p className={`text-sm font-semibold text-slate-900 ${truncate ? 'truncate' : ''}`}>{value}</p>
    </div>
  )
}
