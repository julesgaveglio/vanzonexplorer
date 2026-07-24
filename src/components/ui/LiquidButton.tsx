"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Bouton du site : plein, sobre, coins légèrement arrondis.
 *
 * (Anciennement un bouton « liquid glass » animé multicolore — retiré en
 * juillet 2026 au profit d'un rendu simple et professionnel. Le composant
 * garde son nom et son API pour ne pas toucher les ~17 pages qui l'utilisent.)
 */

// ── Palettes ─────────────────────────────────────────────────────────────────
// Les deux couleurs signature de Vanzon sont des DÉGRADÉS, repris à l'identique
// du site : le bleu du H1 « Location de vans aménagés » (blue-400 → sky-300) et
// le doré du mot « Academy » (--gold → --gold-light). `grad`/`gradHover` priment
// sur `bg`/`hover` quand ils sont définis.
const BLUE_GRAD = "linear-gradient(135deg, #60A5FA 0%, #7DD3FC 100%)";
const GOLD_GRAD = "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)";

const VARIANTS = {
  blue: { grad: BLUE_GRAD, text: "#ffffff", ring: "#60A5FA", shadow: true },
  gold: { grad: GOLD_GRAD, text: "#ffffff", ring: "#B9945F", shadow: true },
  purple: { bg: "#7C3AED", hover: "#6D28D9", text: "#ffffff", ring: "#7C3AED" },
  slate: { bg: "#334155", hover: "#1E293B", text: "#ffffff", ring: "#334155" },
  rose: { bg: "#E11D48", hover: "#BE123C", text: "#ffffff", ring: "#E11D48" },
  orange: { bg: "#EA580C", hover: "#C2410C", text: "#ffffff", ring: "#EA580C" },
  green: { bg: "#16A34A", hover: "#15803D", text: "#ffffff", ring: "#16A34A" },
  // Secondaire : fond blanc, bordure, texte foncé (marche sur clair comme sur sombre)
  ghost: { bg: "#ffffff", hover: "#F1F5F9", text: "#0F172A", ring: "#94A3B8", bordered: true },
  // alias historique → même bleu Vanzon
  primary: { grad: BLUE_GRAD, text: "#ffffff", ring: "#60A5FA", shadow: true },
} as const;

export type LiquidVariant = keyof typeof VARIANTS;

const SIZE_CLASSES = {
  sm: "text-xs px-4 py-2",
  md: "text-sm px-5 py-2.5",
  lg: "text-base px-8 py-4",
  // S'adapte à toutes les largeurs mobiles (iPhone SE 320px → desktop)
  responsive: "text-sm px-5 py-3 sm:px-7 sm:py-3.5 lg:text-base lg:px-8 lg:py-4",
};

interface LiquidButtonProps {
  variant?: LiquidVariant;
  size?: keyof typeof SIZE_CLASSES;
  children: React.ReactNode;
  className?: string;
  href?: string;
  external?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  fullWidth?: boolean;
  /** Conservé pour compat API (n'a plus d'effet depuis la refonte). */
  shineDelay?: number;
}

export default function LiquidButton({
  variant = "blue",
  size = "md",
  children,
  className = "",
  href,
  external = false,
  type = "button",
  onClick,
  disabled,
  ariaLabel,
  fullWidth = false,
}: LiquidButtonProps) {
  const [hovered, setHovered] = useState(false);
  const palette = VARIANTS[variant];
  const bordered = "bordered" in palette && palette.bordered;
  const gradient = "grad" in palette ? palette.grad : null;
  const shadow = "shadow" in palette && palette.shadow;

  const stateHandlers = disabled
    ? {}
    : {
        onPointerEnter: () => setHovered(true),
        onPointerLeave: () => setHovered(false),
      };

  const active = hovered && !disabled;
  const solidBg = "bg" in palette ? palette.bg : undefined;
  const style: React.CSSProperties = {
    // Dégradé Vanzon (bleu / doré) prioritaire ; sinon couleur pleine.
    // La couleur ne change PAS au survol : seul un léger zoom réagit.
    backgroundImage: gradient ? gradient ?? undefined : undefined,
    backgroundColor: gradient ? undefined : solidBg,
    color: palette.text,
    border: bordered ? "1px solid #E2E8F0" : "1px solid transparent",
    boxShadow: shadow
      ? active
        ? "0 8px 22px rgba(0,0,0,0.18)"
        : "0 4px 14px rgba(0,0,0,0.12)"
      : bordered
        ? "0 1px 2px rgba(0,0,0,0.04)"
        : "0 1px 2px rgba(0,0,0,0.08)",
    transform: active ? "scale(1.04)" : "scale(1)",
    // Texte net sur les dégradés clairs (extrémité sky / doré clair).
    textShadow: gradient ? "0 1px 1px rgba(0,0,0,0.18)" : undefined,
    opacity: disabled ? 0.5 : 1,
  };

  const classes = [
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none",
    "transition-transform duration-200 ease-out outline-none",
    "focus-visible:ring-2 focus-visible:ring-offset-2",
    "active:scale-[0.98]",
    SIZE_CLASSES[size],
    fullWidth ? "w-full" : "",
    disabled ? "cursor-not-allowed" : "cursor-pointer",
    className,
  ].join(" ");

  const ringStyle = { "--tw-ring-color": palette.ring } as React.CSSProperties;

  if (href) {
    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        className={classes}
        style={{ ...style, ...ringStyle }}
        {...stateHandlers}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={classes}
      style={{ ...style, ...ringStyle }}
      {...stateHandlers}
    >
      {children}
    </button>
  );
}
