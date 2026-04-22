"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface PromoCodeBlockProps {
  code: string;
  onCopy?: () => void;
}

export default function PromoCodeBlock({ code, onCopy }: PromoCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silencieux
    }
  };

  return (
    <div className="w-full rounded-xl bg-earth p-5 text-cream">
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-cream/60">Code promo</p>
          <p className="font-display text-2xl font-medium tracking-[0.15em]">{code}</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-lg border border-cream/20 px-4 py-2 text-sm transition-colors hover:bg-cream/10"
        >
          {copied ? (
            <><Check className="h-4 w-4" />Copié !</>
          ) : (
            <><Copy className="h-4 w-4" />Copier</>
          )}
        </button>
      </div>
      <p className="mt-3 text-xs text-cream/40">
        S&apos;applique automatiquement via notre lien partenaire
      </p>
    </div>
  );
}
