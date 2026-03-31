import type { Van } from "@/lib/sanity/types";

// ── Check icon ─────────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// ── Mapping équipements ────────────────────────────────────────────────────
interface EquipmentItem {
  key: string;
  label: string;
  detailKey?: string;
  suffix?: string;
}

const ALL_ITEMS: EquipmentItem[] = [
  { key: "eq_bed_type",      label: "Lit",                detailKey: "eq_bed_type" },
  { key: "eq_bed_size",      label: "Dimensions lit",     detailKey: "eq_bed_size" },
  { key: "eq_shower",        label: "Douche solaire",     detailKey: "eq_shower_type" },
  { key: "eq_toilet",        label: "Toilettes sèches",   detailKey: "eq_toilet_type" },
  { key: "eq_kitchen",       label: "Cuisine coulissante",detailKey: "eq_stove_type" },
  { key: "eq_fridge",        label: "Réfrigérateur",      detailKey: "eq_fridge_liters", suffix: "L" },
  { key: "eq_freezer",       label: "Congélateur" },
  { key: "eq_heating",       label: "Chauffage",          detailKey: "eq_heating_type" },
  { key: "eq_solar",         label: "Panneau solaire",    detailKey: "eq_solar_watts", suffix: "W" },
  { key: "eq_battery_ah",    label: "Batterie",           suffix: "Ah" },
  { key: "eq_inverter_220v", label: "Onduleur 220V" },
  { key: "eq_wifi",          label: "Wi-Fi" },
  { key: "eq_usb_ports",     label: "Ports USB" },
  { key: "eq_bluetooth",     label: "Bluetooth" },
  { key: "eq_tv",            label: "Télévision" },
  { key: "eq_outdoor_awning",label: "Auvent / Store" },
  { key: "eq_outdoor_chairs",label: "Chaise de camping" },
  { key: "eq_outdoor_bbq",   label: "Barbecue" },
  { key: "eq_surf_rack",     label: "Porte-surf" },
  { key: "eq_bike_rack",     label: "Porte-vélos" },
];

// ── Traductions ────────────────────────────────────────────────────────────
const LABELS: Record<string, string> = {
  fixed: "fixe", convertible: "convertible", bunk: "superposés",
  hot: "eau chaude", solar: "solaire", outdoor: "extérieure",
  chemical: "chimique", cassette: "cassette", compost: "compost",
  induction: "induction", gas: "gaz", both: "induction + gaz",
  webasto: "Webasto", truma: "Truma", clim: "climatisation",
};

function translate(val: unknown): string {
  if (typeof val === "string") return LABELS[val] ?? val;
  if (typeof val === "number") return String(val);
  return "";
}

// ── Component ──────────────────────────────────────────────────────────────
export default function EquipmentGrid({ van }: { van: Van }) {
  const items = ALL_ITEMS.filter((item) => {
    const val = van[item.key as keyof Van];
    return (
      val === true ||
      (typeof val === "string" && val.length > 0) ||
      (typeof val === "number" && val > 0)
    );
  });

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
      {items.map((item) => {
        const detailRaw = item.detailKey ? van[item.detailKey as keyof Van] : undefined;
        const numVal = item.suffix && typeof van[item.key as keyof Van] === "number"
          ? van[item.key as keyof Van] as number
          : undefined;

        let detail = "";
        if (detailRaw && detailRaw !== true) {
          detail = typeof detailRaw === "number" && item.suffix
            ? `${detailRaw} ${item.suffix}`
            : translate(detailRaw);
        } else if (numVal) {
          detail = `${numVal} ${item.suffix}`;
        }

        return (
          <div key={item.key} className="flex items-center gap-2.5">
            <CheckIcon />
            <span className="text-sm text-slate-700">
              {item.label}
              {detail && (
                <span className="text-slate-400 ml-1">({detail})</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
