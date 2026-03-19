import type { ReactNode } from "react";
import type { Van } from "@/lib/sanity/types";

// ── Icônes SVG par catégorie ──────────────────────────────────────────────────

const BedIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12v6m18-6v6M3 18h18M3 9a2 2 0 012-2h4a2 2 0 012 2v3H3V9zm10 0a2 2 0 012-2h4a2 2 0 012 2v3H13V9z" />
  </svg>
);

const ShowerIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h13a6 6 0 016 6v1H3v-1a6 6 0 010-6v-6h0m0 0V6a3 3 0 013-3h2a3 3 0 013 3v6" />
  </svg>
);

const KitchenIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" />
  </svg>
);

const EnergyIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const OutdoorIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l7 18L19 3M5 3h14M5 3l7 7 7-7" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// ── Catégories ────────────────────────────────────────────────────────────────

interface EquipmentItem {
  key: string;
  label: string;
  detailKey?: string;
  suffix?: string;
}

interface EquipmentCategory {
  icon: ReactNode;
  title: string;
  color: string;
  items: EquipmentItem[];
}

const categories: EquipmentCategory[] = [
  {
    icon: <BedIcon />,
    title: "Literie",
    color: "text-indigo-500",
    items: [
      { key: "eq_bed_type", label: "Lit", detailKey: "eq_bed_type" },
      { key: "eq_bed_size", label: "Dimensions", detailKey: "eq_bed_size" },
    ],
  },
  {
    icon: <ShowerIcon />,
    title: "Sanitaires",
    color: "text-sky-500",
    items: [
      { key: "eq_shower", label: "Douche solaire", detailKey: "eq_shower_type" },
      { key: "eq_toilet", label: "Toilettes sèches", detailKey: "eq_toilet_type" },
    ],
  },
  {
    icon: <KitchenIcon />,
    title: "Cuisine",
    color: "text-amber-500",
    items: [
      { key: "eq_kitchen", label: "Cuisine coulissante", detailKey: "eq_stove_type" },
      { key: "eq_fridge", label: "Réfrigérateur", detailKey: "eq_fridge_liters", suffix: "L" },
      { key: "eq_freezer", label: "Congélateur" },
    ],
  },
  {
    icon: <EnergyIcon />,
    title: "Énergie & Confort",
    color: "text-yellow-500",
    items: [
      { key: "eq_heating", label: "Chauffage", detailKey: "eq_heating_type" },
      { key: "eq_solar", label: "Panneau solaire", detailKey: "eq_solar_watts", suffix: "W" },
      { key: "eq_battery_ah", label: "Batterie", suffix: "Ah" },
      { key: "eq_inverter_220v", label: "Onduleur 220V" },
      { key: "eq_wifi", label: "Wi-Fi" },
      { key: "eq_tv", label: "Télévision" },
      { key: "eq_usb_ports", label: "Ports USB" },
      { key: "eq_bluetooth", label: "Bluetooth" },
    ],
  },
  {
    icon: <OutdoorIcon />,
    title: "Extérieur & Sport",
    color: "text-emerald-500",
    items: [
      { key: "eq_outdoor_awning", label: "Auvent / Store" },
      { key: "eq_outdoor_chairs", label: "Chaise de camping" },
      { key: "eq_outdoor_bbq", label: "Barbecue" },
      { key: "eq_surf_rack", label: "Porte-surf" },
      { key: "eq_bike_rack", label: "Porte-vélos" },
    ],
  },
];

// ── Traductions ───────────────────────────────────────────────────────────────

const bedTypeLabels: Record<string, string> = {
  fixed: "Lit fixe",
  convertible: "Convertible",
  bunk: "Superposés",
};

const showerTypeLabels: Record<string, string> = {
  hot: "Eau chaude",
  solar: "Solaire",
  outdoor: "Extérieure",
};

const toiletTypeLabels: Record<string, string> = {
  chemical: "Chimique",
  cassette: "Cassette",
  compost: "Compost",
};

const stoveTypeLabels: Record<string, string> = {
  induction: "Induction",
  gas: "Gaz",
  both: "Induction + Gaz",
};

const heatingTypeLabels: Record<string, string> = {
  webasto: "Webasto",
  truma: "Truma",
  clim: "Climatisation",
};

function getDetailLabel(value: unknown): string {
  if (typeof value === "string") {
    return (
      bedTypeLabels[value] ||
      showerTypeLabels[value] ||
      toiletTypeLabels[value] ||
      stoveTypeLabels[value] ||
      heatingTypeLabels[value] ||
      value
    );
  }
  if (typeof value === "number") return String(value);
  return "";
}

// ── Component ─────────────────────────────────────────────────────────────────

interface EquipmentGridProps {
  van: Van;
}

export default function EquipmentGrid({ van }: EquipmentGridProps) {
  const activeCategories = categories
    .map((cat) => {
      const activeItems = cat.items.filter((item) => {
        const val = van[item.key as keyof Van];
        return (
          val === true ||
          (typeof val === "string" && val.length > 0) ||
          (typeof val === "number" && val > 0)
        );
      });
      return { ...cat, items: activeItems };
    })
    .filter((cat) => cat.items.length > 0);

  if (activeCategories.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {activeCategories.map((cat) => (
        <div
          key={cat.title}
          className="bg-slate-50 rounded-2xl p-5 border border-slate-100"
        >
          {/* Header catégorie */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center ${cat.color}`}>
              {cat.icon}
            </div>
            <h4 className="text-sm font-semibold text-slate-900">{cat.title}</h4>
          </div>

          {/* Liste équipements */}
          <div className="space-y-2.5">
            {cat.items.map((item) => {
              const detailValue = item.detailKey
                ? van[item.detailKey as keyof Van]
                : undefined;
              const numValue =
                item.suffix && typeof van[item.key as keyof Van] === "number"
                  ? van[item.key as keyof Van]
                  : undefined;

              let detail = "";
              if (detailValue && detailValue !== true) {
                detail = getDetailLabel(detailValue);
                if (item.suffix && typeof detailValue === "number") {
                  detail = `${detailValue} ${item.suffix}`;
                }
              } else if (numValue && typeof numValue === "number") {
                detail = `${numValue} ${item.suffix}`;
              }

              return (
                <div key={item.key} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckIcon />
                    <span className="text-sm text-slate-700 truncate">{item.label}</span>
                  </div>
                  {detail && (
                    <span className="flex-shrink-0 text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                      {detail}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
