"use client";

import { useFormContext } from "react-hook-form";

const inputCls =
  "w-full bg-white/75 border border-slate-200 rounded-xl px-4 py-3 text-text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all";

export default function StepOwner() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Vos coordonnées</h3>
        <p className="text-sm text-slate-500 mb-5">Pour que nous puissions vous recontacter et créer votre profil.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
          className={inputCls}
          {...register("owner_email")}
        />
        {errors.owner_email && (
          <p className="text-red-500 text-sm mt-1">{errors.owner_email.message as string}</p>
        )}
      </div>

      <div>
        <label htmlFor="owner_phone" className="block text-sm font-medium text-text-secondary mb-1.5">
          Téléphone
        </label>
        <input
          id="owner_phone"
          type="tel"
          placeholder="06 12 34 56 78"
          className={inputCls}
          {...register("owner_phone")}
        />
        {errors.owner_phone && (
          <p className="text-red-500 text-sm mt-1">{errors.owner_phone.message as string}</p>
        )}
      </div>
    </div>
  );
}
