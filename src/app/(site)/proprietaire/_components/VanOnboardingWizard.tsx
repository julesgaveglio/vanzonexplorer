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

const STORAGE_KEY = "vanzon-wizard-v2";

export const wizardSchema = z.object({
  // Étape 1 — Propriétaire
  owner_first_name: z.string().min(2, "Prénom requis"),
  owner_last_name: z.string().min(2, "Nom requis"),
  owner_email: z.string().email("Email invalide"),
  owner_phone: z.string().min(8, "Téléphone requis"),

  // Étape 2 — Véhicule
  van_type: z.enum(["fourgon", "van", "combi", "camping-car", "autre"]),
  van_brand: z.string().min(1, "Marque requise"),
  van_model: z.string().min(1, "Modèle requis"),
  van_year: z.string().optional(),
  seats: z.string().optional(),
  sleeps: z.coerce.number().min(1, "Couchages requis").max(10),
  transmission: z.enum(["manuelle", "automatique"]),
  equipments: z.array(z.string()),

  // Étape 3 — Photos & description
  title: z.string().min(5, "Titre trop court (min 5 caractères)").max(100),
  description: z.string().min(50, "Description trop courte (min 50 caractères)").max(2000),
  // Slots photos dédiés — 3 obligatoires
  photo_exterior_front: z.string().url("Photo extérieur avant requise"),
  photo_exterior_side: z.string().url().or(z.literal("")).optional(),
  photo_interior: z.string().url("Photo intérieur requise"),
  photo_sleeping: z.string().url("Photo couchage requise"),
  photo_kitchen: z.string().url().or(z.literal("")).optional(),
  photo_bathroom: z.string().url().or(z.literal("")).optional(),
  photo_detail: z.string().url().or(z.literal("")).optional(),

  // Étape 4 — Tarif & localisation
  price_per_day: z.coerce.number().min(20, "Minimum 20€/jour").max(500),
  min_days: z.coerce.number().min(1).max(30),
  deposit: z.string().optional(),
  location_address: z.string().optional(),
  location_postal_code: z.string().optional(),
  location_city: z.string().min(2, "Ville requise"),
  booking_url: z.string().url("Lien invalide").or(z.literal("")),
});

export type WizardFormData = z.infer<typeof wizardSchema>;

const STEP_FIELDS: (keyof WizardFormData)[][] = [
  ["owner_first_name", "owner_last_name", "owner_email", "owner_phone"],
  ["van_type", "van_brand", "van_model", "sleeps", "transmission", "equipments"],
  ["title", "description", "photo_exterior_front", "photo_interior", "photo_sleeping"],
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
      photo_exterior_front: "",
      photo_exterior_side: "",
      photo_interior: "",
      photo_sleeping: "",
      photo_kitchen: "",
      photo_bathroom: "",
      photo_detail: "",
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
      // Construire le tableau de photos ordonné (principale en premier)
      const photos = [
        data.photo_exterior_front,
        data.photo_interior,
        data.photo_sleeping,
        data.photo_exterior_side,
        data.photo_kitchen,
        data.photo_bathroom,
        data.photo_detail,
      ].filter((url): url is string => Boolean(url));

      // Objet structuré pour le contrôle d'affichage futur
      const photo_slots = {
        exterior_front: data.photo_exterior_front,
        exterior_side: data.photo_exterior_side || null,
        interior: data.photo_interior,
        sleeping: data.photo_sleeping,
        kitchen: data.photo_kitchen || null,
        bathroom: data.photo_bathroom || null,
        detail: data.photo_detail || null,
      };

      const payload = {
        owner_first_name: data.owner_first_name,
        owner_last_name: data.owner_last_name,
        owner_email: data.owner_email,
        owner_phone: data.owner_phone,
        van_type: data.van_type,
        van_brand: data.van_brand,
        van_model: data.van_model,
        van_year: data.van_year ? Number(data.van_year) : undefined,
        seats: data.seats ? Number(data.seats) : undefined,
        sleeps: data.sleeps,
        transmission: data.transmission,
        equipments: data.equipments,
        title: data.title,
        description: data.description,
        photos,
        photo_slots,
        price_per_day: data.price_per_day,
        min_days: data.min_days,
        deposit: data.deposit ? Number(data.deposit) : undefined,
        location_address: data.location_address || undefined,
        location_postal_code: data.location_postal_code || undefined,
        location_city: data.location_city,
        booking_url: data.booking_url || "",
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
