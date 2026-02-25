interface PriceDisplayProps {
  startingPrice: number;
  platform?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: { prefix: "text-xs", price: "text-lg", suffix: "text-xs", note: "text-[10px]" },
  md: { prefix: "text-sm", price: "text-2xl", suffix: "text-sm", note: "text-xs" },
  lg: { prefix: "text-base", price: "text-3xl", suffix: "text-base", note: "text-sm" },
};

export default function PriceDisplay({
  startingPrice,
  platform,
  size = "md",
}: PriceDisplayProps) {
  const s = sizeClasses[size];

  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span className={`text-slate-500 ${s.prefix}`}>À partir de</span>
        <span className={`text-blue-600 font-bold ${s.price}`}>
          {startingPrice} €
        </span>
        <span className={`text-slate-400 ${s.suffix}`}>/ nuit</span>
      </div>
      <p className={`text-slate-400 mt-1 ${s.note}`}>
        Prix réel selon les dates sur {platform ?? "la plateforme"}
      </p>
    </div>
  );
}
