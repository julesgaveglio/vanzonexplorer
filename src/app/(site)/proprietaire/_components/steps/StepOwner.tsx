"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useUser } from "@clerk/nextjs";
import PhoneInput from "../PhoneInput";

const inputCls =
  "w-full bg-white/75 border border-slate-200 rounded-xl px-4 py-3 text-text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all";

export default function StepOwner() {
  const { register, setValue, getValues, formState: { errors } } = useFormContext();
  const { user, isLoaded } = useUser();

  // Pre-fill from Clerk if fields are empty
  useEffect(() => {
    if (!isLoaded || !user) return;
    const email = user.emailAddresses?.[0]?.emailAddress ?? "";
    if (email && !getValues("owner_email")) {
      setValue("owner_email", email, { shouldValidate: false });
    }
    if (user.firstName && !getValues("owner_first_name")) {
      setValue("owner_first_name", user.firstName, { shouldValidate: false });
    }
    if (user.lastName && !getValues("owner_last_name")) {
      setValue("owner_last_name", user.lastName, { shouldValidate: false });
    }
  }, [isLoaded, user, setValue, getValues]);

  const clerkEmail = isLoaded ? (user?.emailAddresses?.[0]?.emailAddress ?? "") : "";

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Vos coordonnées</h3>
        <p className="text-sm text-slate-500 mb-5">Pour que nous puissions vous recontacter et créer votre profil.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="owner_first_name" className="block text-sm font-medium text-text-secondary mb-1.5">
            Prénom
          </label>
          <input
            id="owner_first_name"
            type="text"
            placeholder="Votre prénom"
            className={inputCls}
            {...register("owner_first_name")}
          />
          {errors.owner_first_name && (
            <p className="text-red-500 text-sm mt-1">{errors.owner_first_name.message as string}</p>
          )}
        </div>

        <div>
          <label htmlFor="owner_last_name" className="block text-sm font-medium text-text-secondary mb-1.5">
            Nom
          </label>
          <input
            id="owner_last_name"
            type="text"
            placeholder="Votre nom"
            className={inputCls}
            {...register("owner_last_name")}
          />
          {errors.owner_last_name && (
            <p className="text-red-500 text-sm mt-1">{errors.owner_last_name.message as string}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="owner_email" className="block text-sm font-medium text-text-secondary mb-1.5">
          Email
        </label>
        <input
          id="owner_email"
          type="email"
          placeholder="votre@email.com"
          className={clerkEmail ? inputCls + " bg-slate-50 text-slate-500 cursor-not-allowed" : inputCls}
          readOnly={!!clerkEmail}
          {...register("owner_email")}
        />
        {clerkEmail && (
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Récupéré depuis votre compte Vanzon
          </p>
        )}
        {errors.owner_email && (
          <p className="text-red-500 text-sm mt-1">{errors.owner_email.message as string}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Téléphone
        </label>
        <PhoneInput name="owner_phone" />
      </div>
    </div>
  );
}
