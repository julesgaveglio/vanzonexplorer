"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import WizardProgressBar from "./WizardProgressBar";
import StepOwner from "./steps/StepOwner";
import StepVehicle from "./steps/StepVehicle";
import StepPhotos from "./steps/StepPhotos";
import StepPricing from "./steps/StepPricing";
import { ArrowRight } from "lucide-react";

const STORAGE_KEY = "vanzon-wizard-draft";

export const wizardSchema = z.object({
  owner_first_name: z.string().min(2, "Prénom requis"),
  owner_last_name: z.string().min(2, "Nom requis"),
  owner_email: z.string().email("Email invalide"),
  owner_phone: z.string().min(8, "Téléphone requis"),
  van_type: z.enum(["fourgon", "van", "combi", "camping-car", "autre"]),
  van_brand: z.string().min(1, "Marque requise"),
  van_model: z.string().min(1, "Modèle requis"),
  van_year: z.string().optional(),
  seats: z.string().optional(),
  sleeps: z.coerce.number().min(1, "Couchages requis").max(10),
  transmission: z.enum(["manuelle", "automatique"]),
  equipments: z.array(z.string()),
  title: z.string().min(5, "Titre trop court (min 5 caractères)").max(100),
  description: z.string().min(50, "Description trop courte (min 50 caractères)").max(2000),
  photos: z.array(z.string().url()).min(3, "Minimum 3 photos"),
  price_per_day: z.coerce.number().min(20, "Minimum 20€/jour").max(500),
  min_days: z.coerce.number().min(1).max(30),
  deposit: z.string().optional(),
  location_city: z.string().min(2, "Ville requise"),
  booking_url: z.string().url("Lien invalide").or(z.literal("")),
});

export type WizardFormData = z.infer<typeof wizardSchema>;

const STEP_FIELDS: (keyof WizardFormData)[][] = [
  ["owner_first_name", "owner_last_name", "owner_email", "owner_phone"],
  ["van_type", "van_brand", "van_model", "sleeps", "transmission", "equipments"],
  ["title", "description", "photos"],
  ["price_per_day", "min_days", "location_city"],
];

export default function VanOnboardingWizard() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  const methods = useForm<WizardFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(wizardSchema) as any,
    defaultValues: {
      van_type: "fourgon",
      transmission: "manuelle",
      equipments: [],
      photos: [],
      min_days: 2,
      booking_url: "",
    },
    mode: "onTouched",
  });

  const { handleSubmit, trigger, getValues, reset, formState: { isSubmitting } } = methods;

  // Load draft from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        reset({ ...methods.getValues(), ...parsed });
      }
    } catch {
      // ignore parse errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(getValues()));
    } catch {
      // ignore storage errors
    }
  }, [getValues]);

  async function goNext() {
    const fields = STEP_FIELDS[step];
    const valid = await trigger(fields);
    if (!valid) return;
    saveDraft();
    setStep((s) => Math.min(s + 1, 3));
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goBack() {
    saveDraft();
    setStep((s) => Math.max(s - 1, 0));
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function onSubmit(data: WizardFormData) {
    setServerError("");
    try {
      const payload = {
        ...data,
        van_year: data.van_year ? Number(data.van_year) : undefined,
        seats: data.seats ? Number(data.seats) : undefined,
        deposit: data.deposit ? Number(data.deposit) : undefined,
      };

      const res = await fetch("/api/marketplace/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json();
        setServerError(json.error || "Une erreur est survenue.");
        return;
      }

      localStorage.removeItem(STORAGE_KEY);
      setSubmitted(true);
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setServerError("Erreur de connexion. Réessayez.");
    }
  }

  if (submitted) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-text-primary mb-3">
          Votre van a été soumis !
        </h3>
        <p className="text-text-secondary leading-relaxed">
          On vérifie votre fiche et on vous recontacte sous 24h
          pour confirmer la mise en ligne. Merci de votre confiance !
        </p>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div ref={formRef} className="glass-card p-5 sm:p-8 scroll-mt-24">
        <WizardProgressBar currentStep={step} />

        <form onSubmit={handleSubmit(onSubmit)}>
          {step === 0 && <StepOwner />}
          {step === 1 && <StepVehicle />}
          {step === 2 && <StepPhotos />}
          {step === 3 && <StepPricing />}

          {serverError && (
            <p className="text-red-500 text-sm text-center mt-4">{serverError}</p>
          )}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Retour
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-sky-400 hover:from-blue-600 hover:to-sky-500 transition-all shadow-sm"
              >
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-sky-400 hover:from-blue-600 hover:to-sky-500 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Envoi en cours..." : "Soumettre mon van"}
              </button>
            )}
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
