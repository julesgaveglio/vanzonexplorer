"use client";

import { useFormContext } from "react-hook-form";

const inputCls =
  "w-full bg-white/75 border border-slate-200 rounded-xl px-4 py-3 text-text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all";

/* ─── Icônes équipements ─────────────────────────────────────────────────── */

type IconProps = { className?: string };

const Icons = {
  Fridge: (p: IconProps) => (
    <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <line x1="5" y1="9" x2="19" y2="9"/>
      <line x1="9" y1="5.5" x2="9" y2="7.5" strokeLinecap="round" strokeWidth={2}/>
      <line x1="9" y1="12" x2="9" y2="16" strokeLinecap="round" strokeWidth={2}/>
    </svg>
  ),
  Flame: (p: IconProps) => (
    <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2c0 4-3 6-3 10a3 3 0 006 0c0-2-1-3-1-5 1.5 1 2 3 2 5a5 5 0 01-10 0c0-5 4-8 6-10z"/>
    </svg>
  ),
  Droplets: (p: IconProps) => (
    <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.5L6.5 10a6 6 0 1011 0L12 2.5z"/>
      <path strokeLinecap="round" d="M9 16c0 1.5 1.3 2.5 3 2.5"/>
    </svg>
  ),
  Utensils: (p: IconProps) => (
    <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" d="M3 2v6c0 2 1.5 3.5 3.5 3.5S10 10 10 8V2M6.5 11.5V22M14 2v5l2.5 4.5V22" strokeLinejoin="round"/>
    </svg>
  ),
  Shower: (p: IconProps) => (
    <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16c0-5 3-9 8-9s8 4 8 9"/>
      <circle cx="12" cy="7" r="1" fill="currentColor"/>
      <path strokeLinecap="round" d="M8 18l-.5 3M12 18l-.5 3M16 18l-.5 3M10 19l-.3 2M14 19l-.3 2"/>
    </svg>
  ),
  Toilet: (p: IconProps) => (
    <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10v5H5a2 2 0 000 4h14a2 2 0 000-4h-2V4"/>
      <path strokeLinecap="round" d="M9 13v2a3 3 0 006 0v-2"/>
      <line x1="12" y1="18" x2="12" y2="21" strokeLinecap="round"/>
      <line x1="9" y1="21" x2="15" y2="21" strokeLinecap="round"/>
    </svg>
  ),
  Thermometer: (p: IconProps) => (
    <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/>
    </svg>
  ),
  Sun: (p: IconProps) => (
    <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="4"/>
      <path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  ),
  Plug: (p: IconProps) => (
    <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 7h-2V5M6 7H4V5M6 7h12v5a6 6 0 01-12 0V7zM12 17v3"/>
      <line x1="9" y1="5" x2="9" y2="7" strokeLinecap="round"/>
      <line x1="15" y1="5" x2="15" y2="7" strokeLinecap="round"/>
    </svg>
  ),
  Battery: (p: IconProps) => (
    <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="2" y="7" width="18" height="10" rx="2"/>
      <path d="M20 11h2v2h-2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 11h4M10 9v6" strokeLinecap="round"/>
    </svg>
  ),
  Radiator: (p: IconProps) => (
    <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="7" y1="5" x2="7" y2="19" strokeLinecap="round"/>
      <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round"/>
      <line x1="17" y1="5" x2="17" y2="19" strokeLinecap="round"/>
      <line x1="2" y1="10" x2="22" y2="10" strokeLinecap="round"/>
      <line x1="2" y1="14" x2="22" y2="14" strokeLinecap="round"/>
    </svg>
  ),
  Snowflake: (p: IconProps) => (
    <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <line x1="12" y1="2" x2="12" y2="22" strokeLinecap="round"/>
      <line x1="2" y1="12" x2="22" y2="12" strokeLinecap="round"/>
      <line x1="5" y1="5" x2="19" y2="19" strokeLinecap="round"/>
      <line x1="19" y1="5" x2="5" y2="19" strokeLinecap="round"/>
      <path d="M12 6l-2-2M12 6l2-2M12 18l-2 2M12 18l2 2M6 12l-2-2M6 12l-2 2M18 12l2-2M18 12l2 2" strokeLinecap="round"/>
    </svg>
  ),
  Usb: (p: IconProps) => (
    <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v12M7 8h10M7 8l3-4M17 8l-3-4"/>
      <circle cx="12" cy="17" r="2.5" fill="currentColor" stroke="none"/>
    </svg>
  ),
  TypeC: (p: IconProps) => (
    <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="6" y="9.5" width="12" height="5" rx="2.5"/>
      <line x1="6" y1="12" x2="2" y2="12" strokeLinecap="round"/>
      <line x1="18" y1="12" x2="22" y2="12" strokeLinecap="round"/>
      <line x1="9" y1="9.5" x2="9" y2="14.5" strokeLinecap="round"/>
      <line x1="15" y1="9.5" x2="15" y2="14.5" strokeLinecap="round"/>
    </svg>
  ),
  Umbrella: (p: IconProps) => (
    <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 12a11 11 0 00-22 0z"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v6a2 2 0 004 0"/>
    </svg>
  ),
  Bike: (p: IconProps) => (
    <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="5.5" cy="17.5" r="3.5"/>
      <circle cx="18.5" cy="17.5" r="3.5"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 6h2l2 5.5M10 6l2 5.5h6M7 14l3-3.5-2-4.5h4"/>
    </svg>
  ),
  Layers: (p: IconProps) => (
    <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  ),
  MapPin: (p: IconProps) => (
    <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  ),
  Camera: (p: IconProps) => (
    <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8h12a2 2 0 012 2v4a2 2 0 01-2 2H3a2 2 0 01-2-2v-4a2 2 0 012-2z"/>
    </svg>
  ),
  Gauge: (p: IconProps) => (
    <svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" d="M12 22a9 9 0 100-18 9 9 0 000 18z" strokeDasharray="0 0"/>
      <path strokeLinecap="round" d="M12 6v1M6 12H5M18 12h1M7.76 7.76l.71.71M15.54 15.54l.71.71"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12l3-4" strokeWidth={2}/>
    </svg>
  ),
};

/* ─── Groupes équipements ────────────────────────────────────────────────── */

type EqItem = {
  value: string;
  label: string;
  Icon: (p: IconProps) => React.ReactElement;
};

const EQUIPMENT_GROUPS: { label: string; items: EqItem[] }[] = [
  {
    label: "Cuisine",
    items: [
      { value: "frigo",         label: "Réfrigérateur",    Icon: Icons.Fridge    },
      { value: "plaque-cuisson",label: "Plaque de cuisson",Icon: Icons.Flame     },
      { value: "evier",         label: "Évier",            Icon: Icons.Droplets  },
      { value: "vaisselle",     label: "Vaisselle",        Icon: Icons.Utensils  },
    ],
  },
  {
    label: "Sanitaires",
    items: [
      { value: "douche",    label: "Douche",     Icon: Icons.Shower      },
      { value: "wc",        label: "WC",         Icon: Icons.Toilet      },
      { value: "eau-chaude",label: "Eau chaude", Icon: Icons.Thermometer },
    ],
  },
  {
    label: "Énergie & confort",
    items: [
      { value: "panneau-solaire",   label: "Panneau solaire",    Icon: Icons.Sun       },
      { value: "220v",              label: "Prise 220V",         Icon: Icons.Plug      },
      { value: "batterie-auxiliaire",label:"Batterie auxiliaire",Icon: Icons.Battery   },
      { value: "chauffage",         label: "Chauffage",          Icon: Icons.Radiator  },
      { value: "climatisation",     label: "Climatisation",      Icon: Icons.Snowflake },
      { value: "prise-usb",         label: "Prise USB",          Icon: Icons.Usb       },
      { value: "prise-typec",       label: "Prise Type-C",       Icon: Icons.TypeC     },
    ],
  },
  {
    label: "Extérieur & véhicule",
    items: [
      { value: "store",      label: "Store / Auvent",      Icon: Icons.Umbrella },
      { value: "porte-velo", label: "Porte-vélo",          Icon: Icons.Bike     },
      { value: "galerie",    label: "Galerie de toit",     Icon: Icons.Layers   },
      { value: "gps",        label: "GPS",                 Icon: Icons.MapPin   },
      { value: "camera-recul",label:"Caméra de recul",     Icon: Icons.Camera   },
      { value: "regulateur", label: "Régulateur de vitesse",Icon:Icons.Gauge    },
    ],
  },
];

/* ─── Composant ─────────────────────────────────────────────────────────── */

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="seats" className="block text-sm font-medium text-text-secondary mb-1.5">
            Places <span className="text-slate-400 font-normal">(opt.)</span>
          </label>
          <input id="seats" type="number" placeholder="4" min={1} max={10} className={inputCls} {...register("seats")} />
        </div>
        <div>
          <label htmlFor="sleeps" className="block text-sm font-medium text-text-secondary mb-1.5">
            Couchages
          </label>
          <input id="sleeps" type="number" placeholder="2" min={1} max={10} className={inputCls} {...register("sleeps")} />
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

      {/* ── Équipements ── */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-4">
          Équipements
        </label>
        <div className="space-y-5">
          {EQUIPMENT_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                {group.label}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {group.items.map(({ value, label, Icon }) => {
                  const checked = equipments.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleEquipment(value)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border text-left ${
                        checked
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-white border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50/30"
                      }`}
                    >
                      {/* Icon */}
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${checked ? "text-blue-500" : "text-slate-400"}`} />
                      {/* Label */}
                      <span className="leading-tight">{label}</span>
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
