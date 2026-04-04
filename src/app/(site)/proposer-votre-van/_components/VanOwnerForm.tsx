"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import LiquidButton from "@/components/ui/LiquidButton";

const schema = z.object({
  first_name: z.string().min(2, "Prénom requis"),
  email: z.string().email("Email invalide"),
  van_type: z.enum(["fourgon", "minibus", "autre"]),
  location: z.string().min(2, "Localisation requise"),
});

type FormData = z.infer<typeof schema>;

export default function VanOwnerForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { van_type: "fourgon" },
  });

  async function onSubmit(data: FormData) {
    setServerError("");
    try {
      const res = await fetch("/api/van-owner/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        setServerError(json.error || "Une erreur est survenue.");
        return;
      }
      setSubmitted(true);
    } catch {
      setServerError("Erreur de connexion. Réessayez.");
    }
  }

  if (submitted) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-text-primary mb-2">
          Inscription enregistrée !
        </h3>
        <p className="text-text-secondary">
          Merci pour votre intérêt. On vous recontacte très vite pour discuter
          de votre van et des prochaines étapes.
        </p>
      </div>
    );
  }

  const inputCls =
    "w-full bg-white/75 border border-slate-200 rounded-xl px-4 py-3 text-text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="glass-card p-6 sm:p-8 space-y-5"
    >
      <div>
        <label htmlFor="first_name" className="block text-sm font-medium text-text-secondary mb-1.5">
          Prénom
        </label>
        <input
          id="first_name"
          type="text"
          placeholder="Votre prénom"
          className={inputCls}
          {...register("first_name")}
        />
        {errors.first_name && (
          <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1.5">
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="votre@email.com"
          className={inputCls}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="van_type" className="block text-sm font-medium text-text-secondary mb-1.5">
          Type de véhicule
        </label>
        <select
          id="van_type"
          className={inputCls}
          {...register("van_type")}
        >
          <option value="fourgon">Fourgon aménagé</option>
          <option value="minibus">Minibus / Combi</option>
          <option value="autre">Autre</option>
        </select>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-text-secondary mb-1.5">
          Localisation du van
        </label>
        <input
          id="location"
          type="text"
          placeholder="Ville ou département"
          className={inputCls}
          {...register("location")}
        />
        {errors.location && (
          <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-red-500 text-sm text-center">{serverError}</p>
      )}

      <LiquidButton
        type="submit"
        variant="blue"
        size="lg"
        fullWidth
        disabled={isSubmitting}
      >
        {isSubmitting ? "Inscription en cours..." : "Inscrire mon van gratuitement"}
      </LiquidButton>

      <p className="text-xs text-text-secondary text-center">
        Aucun engagement. On vous recontacte pour discuter ensemble.
      </p>
    </form>
  );
}
