// src/app/admin/(protected)/seo-report/_components/StatusBadge.tsx
interface StatusBadgeProps {
  score: number;
  size?: "sm" | "md";
}

export default function StatusBadge({ score, size = "md" }: StatusBadgeProps) {
  const color = score >= 80 ? "bg-emerald-100 text-emerald-700" : score >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  const label = score >= 80 ? "Bon" : score >= 50 ? "À améliorer" : "Critique";
  const cls = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${color} ${cls}`}>
      {label}
    </span>
  );
}
