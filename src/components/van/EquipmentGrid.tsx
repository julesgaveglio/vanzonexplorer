import type { Van } from "@/lib/sanity/types";

// ── Définition des catégories d'équipements ──
interface EquipmentItem {
  key: string;
  label: string;
  /** Clé du champ détail (ex: eq_shower_type) */
  detailKey?: string;
  /** Suffixe pour les valeurs numériques */
  suffix?: string;
}

interface EquipmentCategory {
  icon: string;
  title: string;
  items: EquipmentItem[];
}

const categories: EquipmentCategory[] = [
  {
    icon: "🛏",
    title: "Literie",
    items: [
      { key: "eq_bed_type", label: "Lit", detailKey: "eq_bed_type" },
      { key: "eq_bed_size", label: "Dimensions", detailKey: "eq_bed_size" },
    ],
  },
  {
    icon: "🚿",
    title: "Sanitaires",
    items: [
      { key: "eq_shower", label: "Douche solaire", detailKey: "eq_shower_type" },
      { key: "eq_toilet", label: "Toilettes sèches", detailKey: "eq_toilet_type" },
    ],
  },
  {
    icon: "🍳",
    title: "Cuisine",
    items: [
      { key: "eq_kitchen", label: "Cuisine coulissante", detailKey: "eq_stove_type" },
      { key: "eq_fridge", label: "Réfrigérateur", detailKey: "eq_fridge_liters", suffix: "L" },
      { key: "eq_freezer", label: "Congélateur" },
    ],
  },
  {
    icon: "⚡",
    title: "Énergie & Confort",
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
    icon: "🏄",
    title: "Extérieur & Sport",
    items: [
      { key: "eq_outdoor_awning", label: "Auvent / Store" },
      { key: "eq_outdoor_chairs", label: "Chaise de camping" },
      { key: "eq_outdoor_bbq", label: "Barbecue" },
      { key: "eq_surf_rack", label: "Porte-surf" },
      { key: "eq_bike_rack", label: "Porte-vélos" },
    ],
  },
];

const bedTypeLabels: Record<string, string> = {
  fixed: "Lit fixe",
  convertible: "Lit convertible",
  bunk: "Lits superposés",
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

interface EquipmentGridProps {
  van: Van;
}

export default function EquipmentGrid({ van }: EquipmentGridProps) {
  // Filtrer les catégories qui ont au moins un équipement présent
  const activeCategories = categories
    .map((cat) => {
      const activeItems = cat.items.filter((item) => {
        const val = van[item.key as keyof Van];
        return val === true || (typeof val === "string" && val.length > 0) || (typeof val === "number" && val > 0);
      });
      return { ...cat, items: activeItems };
    })
    .filter((cat) => cat.items.length > 0);

  if (activeCategories.length === 0) return null;

  return (
    <div className="space-y-6">
      {activeCategories.map((cat) => (
        <div key={cat.title}>
          <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
            <span>{cat.icon}</span>
            {cat.title}
          </h4>
          <div className="flex flex-wrap gap-2">
            {cat.items.map((item) => {
              const detailValue = item.detailKey
                ? van[item.detailKey as keyof Van]
                : undefined;
              const numValue = item.suffix && typeof van[item.key as keyof Van] === "number"
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
                <span
                  key={item.key}
                  className="badge-glass !bg-emerald-50 !border-emerald-200/60 !text-emerald-700"
                >
                  <span className="text-emerald-500">✓</span>
                  {item.label}
                  {detail && (
                    <span className="text-emerald-600/70 ml-0.5">
                      ({detail})
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
