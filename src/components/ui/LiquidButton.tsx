"use client";

import { useState } from "react";
import Link from "next/link";

// ── Palettes Vanzon ───────────────────────────────────────────────────────────
const VARIANTS = {
  blue: {
    gradient: "linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)",
    glow: "0 4px 18px rgba(59, 130, 246, 0.50), 0 1px 4px rgba(14, 165, 233, 0.30)",
    textColor: "text-white",
  },
  gold: {
    gradient: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
    glow: "0 4px 18px rgba(185, 148, 95, 0.55), 0 1px 4px rgba(228, 211, 152, 0.30)",
    textColor: "text-white",
  },
  purple: {
    gradient: "linear-gradient(135deg, #883AE2 0%, #8A80E9 100%)",
    glow: "0 4px 18px rgba(136, 58, 226, 0.50), 0 1px 4px rgba(138, 128, 233, 0.30)",
    textColor: "text-white",
  },
  slate: {
    gradient: "linear-gradient(135deg, #334155 0%, #475569 100%)",
    glow: "0 4px 18px rgba(51, 65, 85, 0.50), 0 1px 4px rgba(71, 85, 105, 0.30)",
    textColor: "text-white",
  },
  rose: {
    gradient: "linear-gradient(135deg, #E8436C 0%, #FF6B8A 100%)",
    glow: "0 4px 18px rgba(232, 67, 108, 0.50), 0 1px 4px rgba(255, 107, 138, 0.30)",
    textColor: "text-white",
  },
  // Transparent — fond verre neutre, texte noir (ex: bouton secondaire sur fond clair)
  ghost: {
    gradient: "rgba(255,255,255,0.18)",
    glow: "0 2px 12px rgba(0,0,0,0.08)",
    textColor: "text-slate-900",
  },
  // backwards-compat alias
  primary: {
    gradient: "linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)",
    glow: "0 4px 18px rgba(59, 130, 246, 0.50), 0 1px 4px rgba(14, 165, 233, 0.30)",
    textColor: "text-white",
  },
} as const;

export type LiquidVariant = keyof typeof VARIANTS;

const SIZE_CLASSES = {
  sm: "text-xs px-4 py-2",
  md: "text-sm px-5 py-2.5",
  lg: "text-base px-8 py-4",
  // S'adapte à toutes les largeurs mobiles (iPhone SE 320px → desktop)
  responsive: "text-sm px-5 py-3 sm:text-sm sm:px-7 sm:py-3.5 lg:text-base lg:px-8 lg:py-4",
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
  /** Décalage du reflet en secondes (0 = bouton primaire, 1.9 = bouton secondaire côte à côte) */
  shineDelay?: number;
}

function GlassFilter() {
  return (
    <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden>
      <defs>
        <filter
          id="liquid-btn-glass"
          x="0%" y="0%" width="100%" height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence type="fractalNoise" baseFrequency="0.06 0.06" numOctaves="1" seed="3" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="1.5" result="blurNoise" />
          <feDisplacementMap in="SourceGraphic" in2="blurNoise" scale="50" xChannelSelector="R" yChannelSelector="B" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="2.5" result="final" />
          <feComposite in="final" in2="final" operator="over" />
        </filter>
      </defs>
    </svg>
  );
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
  shineDelay = 0,
}: LiquidButtonProps) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const palette = VARIANTS[variant];
  const sizeClass = SIZE_CLASSES[size];
  const scale = pressed ? 0.97 : hovered && !fullWidth ? 1.07 : 1;
  // fullWidth (cartes fond blanc) : pas de glow externe → pas de contour fantôme
  const currentGlow = pressed ? "none" : (fullWidth ? "none" : palette.glow);
  const glowPulseClass = !pressed && !hovered && !fullWidth ? "liquid-cta-glow-pulse" : "";
  const widthClass = fullWidth ? "w-full" : "";

  const pointerHandlers = disabled
    ? {}
    : {
        onPointerDown:  () => setPressed(true),
        onPointerUp:    () => setPressed(false),
        onPointerLeave: () => { setPressed(false); setHovered(false); },
        onPointerEnter: () => setHovered(true),
        onTouchStart:   () => { setHovered(true); setPressed(true); },
        onTouchEnd:     () => { setPressed(false); setHovered(false); },
        onTouchCancel:  () => { setPressed(false); setHovered(false); },
      };

  const inner = (
    <span
      className={`relative inline-flex items-center justify-center gap-2 font-semibold rounded-full whitespace-nowrap ${palette.textColor} select-none overflow-hidden ${sizeClass} ${widthClass} ${className}`}
      style={{
        transform: `scale(${scale})`,
        transition: "transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
        opacity: disabled ? 0.55 : 1,
        clipPath: "inset(0 round 9999px)",
      }}
      {...pointerHandlers}
    >
      {/* Gradient tint */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{ background: palette.gradient, opacity: 0.82 }}
      />
      {/* Backdrop distortion */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          backdropFilter: 'blur(8px) saturate(160%) url("#liquid-btn-glass")',
          WebkitBackdropFilter: "blur(8px) saturate(160%)",
        }}
      />
      {/* Glass depth shadows */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: [
            "inset 0 1.5px 1px rgba(255,255,255,0.55)",
            "inset 0 -1px 1px rgba(0,0,0,0.20)",
            "inset 2px 0 2px rgba(255,255,255,0.10)",
            "inset -2px 0 2px rgba(0,0,0,0.10)",
            "inset 0 0 10px rgba(255,255,255,0.14)",
          ].join(", "),
        }}
      />
      {/* Top sheen */}
      <span
        aria-hidden
        className="absolute left-[12%] top-0 h-[42%] rounded-full pointer-events-none"
        style={{
          width: "76%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 100%)",
          filter: "blur(1px)",
        }}
      />
      {/* Sweep shine */}
      <span
        aria-hidden
        className="liquid-cta-shine absolute top-0 h-full pointer-events-none rounded-full"
        style={{
          width: "40%",
          left: 0,
          background: "linear-gradient(105deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.38) 45%, rgba(255,255,255,0.55) 55%, rgba(255,255,255,0) 100%)",
          filter: "blur(2px)",
          mixBlendMode: "overlay",
          animationDelay: `${1.2 + shineDelay}s`,
        }}
      />
      {/* Hover brightness */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: "rgba(255,255,255,0.08)",
          opacity: hovered && !pressed ? 1 : 0,
          transition: "opacity 0.18s ease",
        }}
      />
      {/* Text */}
      <span className="relative z-10 inline-flex items-center gap-2 tracking-wide drop-shadow-sm">{children}</span>
    </span>
  );

  const wrapperStyle = {
    // fullWidth : pas de borderRadius sur le wrapper (évite contour blanc sur fond clair)
    borderRadius: fullWidth ? 0 : 9999,
    transition: "box-shadow 0.25s ease",
  };

  const wrapperDisplay = fullWidth ? "flex" : "inline-flex";

  if (href) {
    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        className={`${wrapperDisplay} flex-shrink-0 ${glowPulseClass} ${widthClass}`}
        style={{ ...wrapperStyle, boxShadow: currentGlow }}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {inner}
        <GlassFilter />
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${wrapperDisplay} flex-shrink-0 ${glowPulseClass} ${widthClass}`}
      style={{ ...wrapperStyle, boxShadow: currentGlow, background: "none", border: "none", padding: 0, cursor: disabled ? "not-allowed" : "pointer" }}
    >
      {inner}
      <GlassFilter />
    </button>
  );
}
