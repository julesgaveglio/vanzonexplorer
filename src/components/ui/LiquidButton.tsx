"use client";

import { motion } from "framer-motion";
import Link from "next/link";

type Variant = "primary" | "ghost" | "gold";

interface LiquidButtonProps {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  /** URL interne ou externe */
  href?: string;
  /** Ouvre dans un nouvel onglet avec rel="noopener noreferrer" */
  external?: boolean;
  /** Type du bouton HTML (si pas de href) */
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}

const variantClasses: Record<Variant, string> = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  gold: "inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white rounded-full bg-gradient-to-r from-accent-gold to-orange-500",
};

const sizeClasses: Record<string, string> = {
  sm: "text-sm !px-4 !py-2",
  md: "text-base",
  lg: "text-lg !px-8 !py-4",
};

export default function LiquidButton({
  variant = "primary",
  size = "md",
  children,
  className = "",
  href,
  external,
  type = "button",
  onClick,
  disabled,
  ariaLabel,
}: LiquidButtonProps) {
  const classes = `${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  // ── Lien externe (nouvel onglet) ──
  if (href && external) {
    return (
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        aria-label={ariaLabel}
      >
        {children}
      </motion.a>
    );
  }

  // ── Lien interne (Next.js Link) ──
  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  // ── Bouton classique ──
  return (
    <motion.button
      type={type}
      className={classes}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </motion.button>
  );
}
