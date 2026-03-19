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
  // Violet — Club Privé
  purple: {
    gradient: "linear-gradient(135deg, #883AE2 0%, #8A80E9 100%)",
    glow: "0 4px 18px rgba(136, 58, 226, 0.50), 0 1px 4px rgba(138, 128, 233, 0.30)",
  },
  // Slate — Achat Van / Aménagement
  slate: {
    gradient: "linear-gradient(135deg, #334155 0%, #475569 100%)",
    glow: "0 4px 18px rgba(51, 65, 85, 0.50), 0 1px 4px rgba(71, 85, 105, 0.30)",
  },
};

// ── Mapping catégorie article → CTA ──────────────────────────────────────
const ARTICLE_CATEGORY_CTA: Record<string, CTAConfig> = {
  "Road Trips": { btnLabel: "Louer un van", href: "/location", ...PALETTE.blue },
  "Pays Basque": { btnLabel: "Louer un van", href: "/location", ...PALETTE.blue },
  "Aménagement Van": { btnLabel: "Trouver mon van", href: "/achat", ...PALETTE.slate },
  "Achat Van": { btnLabel: "Trouver mon van", href: "/achat", ...PALETTE.slate },
  "Business Van": { btnLabel: "Découvrir la formation", href: "/formation", ...PALETTE.gold },
  "Club Privé": { btnLabel: "Rejoindre le Club", href: "/club", ...PALETTE.purple },
};

function getCTAConfig(pathname: string): CTAConfig {
  // Formation — doré
  if (pathname.startsWith("/formation")) {
    return {
      btnLabel: "Réserver un appel",
      href: "#",
      calendly: true,
      ...PALETTE.gold,
    };
  }

  // Club Privé — violet
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
      href: "/location",
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

  // Pays Basque & road trip
  if (
    pathname.startsWith("/pays-basque") ||
    pathname.startsWith("/road-trip-pays-basque-van")
  ) {
    return {
      btnLabel: "Louer un van",
      href: "/location",
      ...PALETTE.blue,
    };
  }

  // Articles
  if (pathname.startsWith("/articles")) {
    return {
      btnLabel: "Louer un van",
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
              <CalendlyModal
                className="btn-shine relative text-sm font-semibold px-4 py-2 rounded-full flex-shrink-0 whitespace-nowrap text-white active:scale-95 transition-transform"
                style={{ background: config.gradient, boxShadow: config.glow }}
              >
                {config.btnLabel}
              </CalendlyModal>
            ) : config.scrollTarget ? (
              <button
                onClick={() => {
                  document.getElementById(config.scrollTarget!)?.scrollIntoView({ behavior: "smooth" });
                }}
                className="btn-shine relative text-sm font-semibold px-4 py-2 rounded-full flex-shrink-0 whitespace-nowrap text-white active:scale-95 transition-transform"
                style={{ background: config.gradient, boxShadow: config.glow }}
              >
                {config.btnLabel}
              </button>
            ) : (
              <Link
                href={config.href}
                className="btn-shine relative text-sm font-semibold px-4 py-2 rounded-full flex-shrink-0 whitespace-nowrap text-white active:scale-95 transition-transform"
                style={{ background: config.gradient, boxShadow: config.glow }}
              >
                {config.btnLabel}
              </Link>
            )}
          </div>
    </div>
  );
}
