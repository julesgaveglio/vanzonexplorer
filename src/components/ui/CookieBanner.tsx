"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import Link from "next/link";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function CookieBanner() {
  const [consent, setConsent] = useState<boolean | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cookie_consent");
    if (stored === null) {
      setShowBanner(true);
    } else {
      setConsent(stored === "true");
    }
  }, []);

  function accept() {
    localStorage.setItem("cookie_consent", "true");
    setConsent(true);
    setShowBanner(false);
  }

  function refuse() {
    localStorage.setItem("cookie_consent", "false");
    setConsent(false);
    setShowBanner(false);
  }

  return (
    <>
      {/* Google Analytics — charge uniquement avec consentement */}
      {consent && GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { anonymize_ip: true });
          `}</Script>
        </>
      )}

      {/* Banniere RGPD */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-slate-950 border-t border-white/10 px-4 py-4 shadow-2xl">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-white text-sm font-semibold">Cookies & confidentialite</p>
              <p className="text-white/50 text-xs mt-1 leading-relaxed">
                Nous utilisons Google Analytics pour mesurer notre audience (donnees anonymisees).{" "}
                <Link href="/confidentialite" className="underline hover:text-white/70 transition-colors">
                  En savoir plus
                </Link>
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={refuse}
                className="text-white/50 text-sm hover:text-white transition-colors px-4 py-2 rounded-lg border border-white/10 hover:border-white/20"
              >
                Refuser
              </button>
              <button
                onClick={accept}
                className="bg-white text-slate-900 text-sm font-semibold px-5 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Accepter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
