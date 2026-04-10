'use client'

import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { RoadTripTerminal, type TerminalLine } from './RoadTripTerminal'
import type {
  GroupType,
  VanStatus,
  DurationKey,
  InterestKey,
  BudgetLevel,
  OvernightPreference,
} from '@/types/roadtrip'

// ─── Options wizard ─────────────────────────────────────────────────────────
const GROUP_OPTIONS: { value: GroupType; label: string; emoji: string }[] = [
  { value: 'solo', label: 'Solo', emoji: '🧍' },
  { value: 'couple', label: 'En couple', emoji: '💑' },
  { value: 'amis', label: 'Entre amis', emoji: '👥' },
  { value: 'famille', label: 'En famille', emoji: '👨\u200d👩\u200d👧' },
]

const VAN_STATUS_OPTIONS: {
  value: VanStatus
  title: string
  subtitle: string
  emoji: string
}[] = [
  {
    value: 'proprietaire',
    title: 'Je suis propriétaire d\u2019un van',
    subtitle: 'Itinéraire adapté à votre véhicule',
    emoji: '🔑',
  },
  {
    value: 'locataire',
    title: 'Je souhaite louer un van',
    subtitle: 'On vous propose nos vans Vanzon en plus',
    emoji: '🚐',
  },
]

const DURATION_OPTIONS: { value: DurationKey; label: string }[] = [
  { value: '1j', label: '1 jour' },
  { value: '2-3j', label: '2-3 jours' },
  { value: '4-5j', label: '4-5 jours' },
  { value: '1sem', label: '1 semaine' },
]

const INTEREST_OPTIONS: { value: InterestKey; label: string; emoji: string; desc: string }[] = [
  { value: 'sport', label: 'Sport & Aventure', emoji: '🏄', desc: 'surf, rafting, escalade, VTT' },
  { value: 'nature', label: 'Nature & Randonnée', emoji: '🥾', desc: 'Rhune, Iraty, GR10' },
  { value: 'gastronomie', label: 'Gastronomie Basque', emoji: '🍽️', desc: 'pintxos, restaurants, marchés' },
  { value: 'culture', label: 'Culture & Patrimoine', emoji: '🏛️', desc: 'Espelette, musées, villages' },
  { value: 'plages', label: 'Plages & Détente', emoji: '🏖️', desc: 'Biarritz, Hendaye, Guéthary' },
  { value: 'soirees', label: 'Soirées & Vie Locale', emoji: '🌙', desc: 'bars, fêtes basques' },
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
  emoji: string
}[] = [
  {
    value: 'gratuit',
    label: 'Parkings gratuits & spots sauvages',
    desc: 'Nuit en van tolérée, 0€',
    emoji: '🆓',
  },
  {
    value: 'aires_officielles',
    label: 'Aires camping-car officielles',
    desc: 'Gratuit ou < 15€/nuit, services',
    emoji: '⚡',
  },
  {
    value: 'camping',
    label: 'Campings van-friendly',
    desc: '15-30€/nuit, confort',
    emoji: '🏕️',
  },
  {
    value: 'mix',
    label: 'Mix selon les étapes',
    desc: 'On alterne selon le trajet',
    emoji: '🔀',
  },
]

// ─── Zod schema ─────────────────────────────────────────────────────────────
const schema = z.object({
  firstname: z.string().min(2, { message: 'Minimum 2 caractères' }).max(50),
  email: z.string().email({ message: 'Email invalide' }),
  groupType: z.enum(['solo', 'couple', 'amis', 'famille']),
  vanStatus: z.enum(['proprietaire', 'locataire']),
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
  2: ['vanStatus'],
  3: ['duration', 'interests'],
  4: ['budgetLevel', 'overnightPreference'],
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
      firstname: '',
      email: '',
      groupType: 'couple',
      vanStatus: 'locataire',
      duration: '2-3j',
      interests: [],
      budgetLevel: 'moyen',
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
        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-4xl">
          🚐
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
  const selectedDuration = watch('duration')
  const selectedBudget = watch('budgetLevel')
  const selectedOvernight = watch('overnightPreference')

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-8">
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
                        <span className="text-2xl">{opt.emoji}</span>
                        <span className="text-sm font-semibold text-slate-900">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─ Step 2 : Situation van ─ */}
          {step === 2 && (
            <motion.div
              key={2}
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
                    <span className="text-5xl">{opt.emoji}</span>
                    <span className="text-base font-bold text-slate-900">{opt.title}</span>
                    <span className="text-xs text-slate-500">{opt.subtitle}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─ Step 3 : Envies Pays Basque ─ */}
          {step === 3 && (
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
                            <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
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

          {/* ─ Step 4 : Budget & nuit van ─ */}
          {step === 4 && (
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
                          <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
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
                    values.vanStatus === 'proprietaire' ? 'Propriétaire' : 'Futur locataire'
                  }
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
                    🌙 Nuit en van
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
              className="btn-primary flex-1 py-3 rounded-xl text-sm font-semibold text-white"
            >
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
