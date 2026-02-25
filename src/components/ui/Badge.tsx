interface BadgeProps {
  children: React.ReactNode;
  /** Icône optionnelle (emoji ou composant) */
  icon?: React.ReactNode;
  /** Variante de couleur */
  variant?: "default" | "blue" | "teal" | "gold";
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: "badge-glass",
  blue: "badge-glass !border-accent-blue/20 !text-accent-blue",
  teal: "badge-glass !border-accent-teal/20 !text-accent-teal",
  gold: "badge-glass !border-accent-gold/20 !text-accent-gold",
};

export default function Badge({
  children,
  icon,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span className={`${variantClasses[variant]} ${className}`}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
