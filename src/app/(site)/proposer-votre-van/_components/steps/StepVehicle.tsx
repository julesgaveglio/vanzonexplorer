"use client";

import { useFormContext } from "react-hook-form";

const inputCls =
  "w-full bg-white/75 border border-slate-200 rounded-xl px-4 py-3 text-text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all";

const EQUIPMENT_GROUPS = [
  {
    label: "Cuisine",
    items: [
      { value: "frigo", label: "Réfrigérateur" },
      { value: "plaque-cuisson", label: "Plaque de cuisson" },
      { value: "evier", label: "Évier" },
      { value: "vaisselle", label: "Vaisselle" },
    ],
  },
  {
    label: "Sanitaires",
    items: [
      { value: "douche", label: "Douche" },
      { value: "wc", label: "WC" },
      { value: "eau-chaude", label: "Eau chaude" },
    ],
  },
  {
    label: "Énergie & confort",
    items: [
      { value: "panneau-solaire", label: "Panneau solaire" },
      { value: "220v", label: "Prise 220V" },
      { value: "batterie-auxiliaire", label: "Batterie auxiliaire" },
      { value: "chauffage", label: "Chauffage" },
      { value: "climatisation", label: "Climatisation" },
    ],
  },
  {
    label: "Extérieur & véhicule",
    items: [
      { value: "store", label: "Store / Auvent" },
      { value: "porte-velo", label: "Porte-vélo" },
      { value: "galerie", label: "Galerie de toit" },
      { value: "gps", label: "GPS" },
      { value: "camera-recul", label: "Caméra de recul" },
      { value: "regulateur", label: "Régulateur de vitesse" },
    ],
  },
];

export default function StepVehicle() {
  const { register, formState: { errors }, watch, setValue, getValues } = useFormContext();

  const toggleEquipment = (value: string) => {
    const current: string[] = getValues("equipments") || [];
    if (current.includes(value)) {
      setValue("equipments", current.filter((v: string) => v !== value));
    } else {
      setValue("equipments", [...current, value]);
    }
  };

  const equipments: string[] = watch("equipments") || [];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Votre van</h3>
        <p className="text-sm text-slate-500 mb-5">Les informations de base sur votre véhicule.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="van_type" className="block text-sm font-medium text-text-secondary mb-1.5">
            Type de véhicule
          </label>
          <select id="van_type" className={inputCls} {...register("van_type")}>
            <option value="fourgon">Fourgon aménagé</option>
            <option value="van">Van</option>
            <option value="combi">Combi / Minibus</option>
            <option value="camping-car">Camping-car</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div>
          <label htmlFor="van_brand" className="block text-sm font-medium text-text-secondary mb-1.5">
            Marque
          </label>
          <input
            id="van_brand"
            type="text"
            placeholder="Ex : Renault, Volkswagen..."
            className={inputCls}
            {...register("van_brand")}
          />
          {errors.van_brand && (
            <p className="text-red-500 text-sm mt-1">{errors.van_brand.message as string}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="van_model" className="block text-sm font-medium text-text-secondary mb-1.5">
            Modèle
          </label>
          <input
            id="van_model"
            type="text"
            placeholder="Ex : Trafic L2H1, T6.1..."
            className={inputCls}
            {...register("van_model")}
          />
          {errors.van_model && (
            <p className="text-red-500 text-sm mt-1">{errors.van_model.message as string}</p>
          )}
        </div>
        <div>
          <label htmlFor="van_year" className="block text-sm font-medium text-text-secondary mb-1.5">
            Année <span className="text-slate-400 font-normal">(optionnel)</span>
          </label>
          <input
            id="van_year"
            type="number"
            placeholder="2020"
            min={1990}
            max={2027}
            className={inputCls}
            {...register("van_year")}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="seats" className="block text-sm font-medium text-text-secondary mb-1.5">
            Places <span className="text-slate-400 font-normal">(opt.)</span>
          </label>
          <input
            id="seats"
            type="number"
            placeholder="4"
            min={1}
            max={10}
            className={inputCls}
            {...register("seats")}
          />
        </div>
        <div>
          <label htmlFor="sleeps" className="block text-sm font-medium text-text-secondary mb-1.5">
            Couchages
          </label>
          <input
            id="sleeps"
            type="number"
            placeholder="2"
            min={1}
            max={10}
            className={inputCls}
            {...register("sleeps")}
          />
          {errors.sleeps && (
            <p className="text-red-500 text-sm mt-1">{errors.sleeps.message as string}</p>
          )}
        </div>
        <div>
          <label htmlFor="transmission" className="block text-sm font-medium text-text-secondary mb-1.5">
            Boîte
          </label>
          <select id="transmission" className={inputCls} {...register("transmission")}>
            <option value="manuelle">Manuelle</option>
            <option value="automatique">Automatique</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Équipements
        </label>
        <div className="space-y-4">
          {EQUIPMENT_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {group.label}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {group.items.map((item) => {
                  const isChecked = equipments.includes(item.value);
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => toggleEquipment(item.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                        isChecked
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded flex items-center justify-center text-xs ${
                        isChecked ? "bg-blue-500 text-white" : "bg-slate-100"
                      }`}>
                        {isChecked && "✓"}
                      </span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
