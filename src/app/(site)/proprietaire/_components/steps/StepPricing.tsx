"use client";

import { useFormContext } from "react-hook-form";

const inputCls =
  "w-full bg-white/75 border border-slate-200 rounded-xl px-4 py-3 text-text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all";

export default function StepPricing() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Tarif & localisation</h3>
        <p className="text-sm text-slate-500 mb-5">Dernière étape ! Indiquez votre tarif et où se trouve votre van.</p>
      </div>

      {/* Tarif */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="price_per_day" className="block text-sm font-medium text-text-secondary mb-1.5">
            Prix par jour
          </label>
          <div className="relative">
            <input
              id="price_per_day"
              type="number"
              placeholder="75"
              min={20}
              max={500}
              className={inputCls + " pr-14"}
              {...register("price_per_day")}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">€/jour</span>
          </div>
          {errors.price_per_day && (
            <p className="text-red-500 text-sm mt-1">{errors.price_per_day.message as string}</p>
          )}
        </div>

        <div>
          <label htmlFor="min_days" className="block text-sm font-medium text-text-secondary mb-1.5">
            Durée minimum
          </label>
          <div className="relative">
            <input
              id="min_days"
              type="number"
              placeholder="2"
              min={1}
              max={30}
              className={inputCls + " pr-14"}
              {...register("min_days")}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">nuits</span>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="deposit" className="block text-sm font-medium text-text-secondary mb-1.5">
          Caution <span className="text-slate-400 font-normal">(optionnel)</span>
        </label>
        <div className="relative max-w-[200px]">
          <input
            id="deposit"
            type="number"
            placeholder="500"
            min={0}
            max={5000}
            className={inputCls + " pr-8"}
            {...register("deposit")}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">€</span>
        </div>
      </div>

      {/* Localisation */}
      <div className="pt-1">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Adresse de départ du van</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="location_address" className="block text-sm font-medium text-text-secondary mb-1.5">
              Adresse <span className="text-slate-400 font-normal">(optionnel)</span>
            </label>
            <input
              id="location_address"
              type="text"
              placeholder="Ex : 12 rue des Pyrénées"
              className={inputCls}
              {...register("location_address")}
            />
          </div>

          <div>
            <label htmlFor="location_city" className="block text-sm font-medium text-text-secondary mb-1.5">
              Ville
            </label>
            <input
              id="location_city"
              type="text"
              placeholder="Ex : Bayonne, Bordeaux..."
              className={inputCls}
              {...register("location_city")}
            />
            {errors.location_city && (
              <p className="text-red-500 text-sm mt-1">{errors.location_city.message as string}</p>
            )}
          </div>

          <div>
            <label htmlFor="location_postal_code" className="block text-sm font-medium text-text-secondary mb-1.5">
              Code postal <span className="text-slate-400 font-normal">(optionnel)</span>
            </label>
            <input
              id="location_postal_code"
              type="text"
              placeholder="64100"
              className={inputCls}
              {...register("location_postal_code")}
            />
          </div>
        </div>
      </div>

      {/* Lien annonce */}
      <div>
        <label htmlFor="booking_url" className="block text-sm font-medium text-text-secondary mb-1.5">
          Lien vers votre annonce
        </label>
        <input
          id="booking_url"
          type="url"
          placeholder="https://www.yescapa.fr/... ou leboncoin.fr/... ou tout autre lien"
          className={inputCls}
          {...register("booking_url")}
        />
        {errors.booking_url && (
          <p className="text-red-500 text-sm mt-1">{errors.booking_url.message as string}</p>
        )}
        <p className="text-xs text-slate-400 mt-1">
          Facultatif — les visiteurs seront redirigés vers ce lien pour réserver votre van
        </p>
      </div>
    </div>
  );
}
