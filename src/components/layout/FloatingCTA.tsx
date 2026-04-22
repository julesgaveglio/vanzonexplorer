"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CalendlyModal from "@/components/ui/CalendlyModal";
import { usePathname, useRouter } from "next/navigation";
import { useArticleCategory } from "@/lib/contexts/ArticleCategoryContext";

type CTAConfig = {
  btnLabel: string;
  href: string;
  gradient: string;
  glow: string;
  scrollTarget?: string;
  calendly?: boolean;
};

// ── Palettes dégradés Vanzon ───────────────────────────────────────────────
const PALETTE = {
  // Bleu — Location & Road Trips
  blue: {
    gradient: "linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)",
    glow: "0 4px 18px rgba(59, 130, 246, 0.50), 0 1px 4px rgba(14, 165, 233, 0.30)",
  },
  // Doré — Formation
  gold: {
    gradient: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
    glow: "0 4px 18px rgba(185, 148, 95, 0.55), 0 1px 4px rgba(228, 211, 152, 0.30)",
  },
  // Violet — Club
  purple: {
    gradient: "linear-gradient(135deg, #883AE2 0%, #8A80E9 100%)",
    glow: "0 4px 18px rgba(136, 58, 226, 0.50), 0 1px 4px rgba(138, 128, 233, 0.30)",
  },
  // Slate — Achat Van / Aménagement
  slate: {
    gradient: "linear-gradient(135deg, #334155 0%, #475569 100%)",
    glow: "0 4px 18px rgba(51, 65, 85, 0.50), 0 1px 4px rgba(71, 85, 105, 0.30)",
  },
  // Noir — Road Trip Personnalisé
  black: {
    gradient: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
    glow: "0 4px 18px rgba(0, 0, 0, 0.45), 0 1px 4px rgba(15, 23, 42, 0.30)",
  },
};

// ── Mapping catégorie article → CTA ──────────────────────────────────────
const ARTICLE_CATEGORY_CTA: Record<string, CTAConfig> = {
  "Road Trips": { btnLabel: "Louer un van au Pays Basque", href: "/location", ...PALETTE.blue },
  "Pays Basque": { btnLabel: "Louer un van au Pays Basque", href: "/location", ...PALETTE.blue },
  "Aménagement Van": { btnLabel: "Trouver mon van", href: "/achat", ...PALETTE.slate },
  "Achat Van": { btnLabel: "Trouver mon van", href: "/achat", ...PALETTE.slate },
  // Business Van: disabled — VSLStickyBar handles mobile CTA on these articles
  "Club": { btnLabel: "Rejoindre le Club", href: "/club", ...PALETTE.purple },
};

function getCTAConfig(pathname: string): CTAConfig | null {
  // Formation — doré
  if (pathname.startsWith("/formation")) {
    return {
      btnLabel: "En savoir plus",
      href: "/van-business-academy/presentation",
      ...PALETTE.gold,
    };
  }

  // Club — violet
  if (pathname.startsWith("/club")) {
    return {
      btnLabel: "Rejoindre le Club",
      href: "/club#rejoindre",
      ...PALETTE.purple,
    };
  }

  // Achat — fiche van spécifique
  if (pathname.startsWith("/achat/")) {
    return {
      btnLabel: "Nous contacter",
      href: "/contact",
      ...PALETTE.blue,
    };
  }

  // Achat — page principale
  if (pathname.startsWith("/achat")) {
    return {
      btnLabel: "Demander un devis",
      href: "/contact",
      ...PALETTE.blue,
    };
  }

  // Location — fiche van spécifique
  if (pathname.startsWith("/location/")) {
    return {
      btnLabel: "Réserver ce van",
      href: "#reserver",
      scrollTarget: "reserver",
      ...PALETTE.blue,
    };
  }

  // Location — page liste
  if (pathname.startsWith("/location")) {
    return {
      btnLabel: "Voir les vans",
      href: "/location#vans",
      ...PALETTE.blue,
    };
  }

  // Road Trip Personnalisé
  if (pathname === '/road-trip-personnalise') {
    return {
      btnLabel: 'Générer mon itinéraire',
      href: '#wizard',
      scrollTarget: 'wizard',
      ...PALETTE.black,
    }
  }

  // Pays Basque & road trip
  if (
    pathname.startsWith("/pays-basque") ||
    pathname.startsWith("/road-trip-pays-basque-van")
  ) {
    return {
      btnLabel: "Louer un van au Pays Basque",
      href: "/location",
      ...PALETTE.blue,
    };
  }

  // Articles
  if (pathname.startsWith("/articles")) {
    return {
      btnLabel: "Louer un van au Pays Basque",
      href: "/location",
      ...PALETTE.blue,
    };
  }

  // À propos
  if (pathname.startsWith("/a-propos")) {
    return {
      btnLabel: "Nous contacter",
      href: "/contact",
      ...PALETTE.blue,
    };
  }

  // Contact
  if (pathname.startsWith("/contact")) {
    return {
      btnLabel: "Louer un van",
      href: "/location",
      ...PALETTE.blue,
    };
  }

  // Dashboard / espace perso
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/user")) {
    return {
      btnLabel: "Louer un van",
      href: "/location",
      ...PALETTE.blue,
    };
  }

  // Pages légales
  if (
    pathname.startsWith("/mentions-legales") ||
    pathname.startsWith("/confidentialite")
  ) {
    return {
      btnLabel: "Retour à l'accueil",
      href: "/",
      ...PALETTE.blue,
    };
  }

  // Marketplace — pas de floating CTA
  if (pathname.startsWith("/proprietaire")) {
    return null;
  }

  // Auth pages
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
    return {
      btnLabel: "Découvrir Vanzon",
      href: "/",
      ...PALETTE.blue,
    };
  }

  // Homepage & fallback
  return {
    btnLabel: "Louer un van",
    href: "/location",
    scrollTarget: pathname === "/" ? "nos-vans" : undefined,
    ...PALETTE.blue,
  };
}

// ── Liquid Glass CTA Button ────────────────────────────────────────────────
function LiquidCTAButton({
  gradient,
  glow,
  children,
  className = "",
  onClick,
  href,
}: {
  gradient: string;
  glow: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
}) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const scale = pressed ? 0.94 : hovered ? 1.07 : 1;
  const currentGlow = pressed ? "none" : glow;

  const pointerHandlers = {
    onPointerDown:   () => setPressed(true),
    onPointerUp:     () => setPressed(false),
    onPointerLeave:  () => { setPressed(false); setHovered(false); },
    onPointerEnter:  () => setHovered(true),
    onTouchStart:    () => { setHovered(true); setPressed(true); },
    onTouchEnd:      () => { setPressed(false); setHovered(false); },
    onTouchCancel:   () => { setPressed(false); setHovered(false); },
  };

  const inner = (
    <span
      className={`relative inline-flex items-center justify-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full whitespace-nowrap text-white flex-shrink-0 select-none overflow-hidden ${className}`}
      style={{
        transform: `scale(${scale})`,
        transition: "transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
        clipPath: "inset(0 round 9999px)",
      }}
      {...pointerHandlers}
    >
      {/* Gradient tint — semi-transparent Vanzon color */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{ background: gradient, opacity: 0.82 }}
      />

      {/* Backdrop distortion */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          backdropFilter: 'blur(8px) saturate(160%) url("#liquid-cta-glass")',
          WebkitBackdropFilter: 'blur(8px) saturate(160%)',
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

      {/* Top sheen — static frosted highlight */}
      <span
        aria-hidden
        className="absolute left-[12%] top-0 h-[42%] rounded-full pointer-events-none"
        style={{
          width: "76%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 100%)",
          filter: "blur(1px)",
        }}
      />

      {/* Sweep shine — diagonal white streak looping */}
      <span
        aria-hidden
        className="liquid-cta-shine absolute top-0 h-full pointer-events-none rounded-full"
        style={{
          width: "40%",
          left: 0,
          background: "linear-gradient(105deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.38) 45%, rgba(255,255,255,0.55) 55%, rgba(255,255,255,0) 100%)",
          filter: "blur(2px)",
          mixBlendMode: "overlay",
        }}
      />

      {/* Hover brightness overlay */}
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
      <span className="relative z-10 tracking-wide drop-shadow-sm">{children}</span>
    </span>
  );

  const wrapperStyle = {
    borderRadius: 9999,
    transition: "box-shadow 0.25s ease",
  };

  // Pulsing glow wrapper
  const glowWrapperClass = !pressed && !hovered ? "liquid-cta-glow-pulse" : "";

  if (href) {
    return (
      <Link
        href={href}
        className={`flex-shrink-0 ${glowWrapperClass}`}
        style={{ ...wrapperStyle, boxShadow: currentGlow }}
      >
        {inner}
        <GlassFilterCTA />
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 ${glowWrapperClass}`}
      style={{ ...wrapperStyle, boxShadow: currentGlow, background: "none", border: "none", padding: 0, cursor: "pointer" }}
    >
      {inner}
      <GlassFilterCTA />
    </button>
  );
}

function GlassFilterCTA() {
  return (
    <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden>
      <defs>
        <filter
          id="liquid-cta-glass"
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

export default function FloatingCTA() {
  const [visible, setVisible] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { category } = useArticleCategory();

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  // Sur un article spécifique avec catégorie connue : CTA dynamique
  const isArticlePage = pathname.startsWith("/articles/") && pathname !== "/articles/";
  const config =
    isArticlePage && category && ARTICLE_CATEGORY_CTA[category]
      ? ARTICLE_CATEGORY_CTA[category]
      : getCTAConfig(pathname);

  if (!config) return null;

  return (
    <div
      className={`fixed bottom-6 left-4 right-4 z-30 lg:hidden transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "translate-y-[calc(100%+1.5rem)]"
      }`}
    >
          <div
            className="glass-card flex items-center justify-between gap-3 px-4 py-3"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.10)" }}
          >
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors flex-shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Retour
            </button>

            {config.calendly ? (
              <CalendlyModal asChild>
                <LiquidCTAButton gradient={config.gradient} glow={config.glow}>
                  {config.btnLabel}
                </LiquidCTAButton>
              </CalendlyModal>
            ) : config.scrollTarget ? (
              <LiquidCTAButton
                gradient={config.gradient}
                glow={config.glow}
                onClick={() => {
                  document.getElementById(config.scrollTarget!)?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {config.btnLabel}
              </LiquidCTAButton>
            ) : (
              <LiquidCTAButton gradient={config.gradient} glow={config.glow} href={config.href}>
                {config.btnLabel}
              </LiquidCTAButton>
            )}
          </div>
    </div>
  );
}
