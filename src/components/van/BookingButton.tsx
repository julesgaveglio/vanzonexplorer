interface BookingButtonProps {
  url: string;
  platform: string;
  insuranceIncluded?: boolean;
  achatHref?: string;
}

export default function BookingButton({
  url,
  platform,
  insuranceIncluded = true,
  achatHref,
}: BookingButtonProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Bouton Yescapa — rose officiel */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-shine relative inline-flex items-center justify-center gap-2 w-full font-bold text-white py-3.5 px-5 rounded-2xl text-sm active:scale-95 transition-transform"
        style={{
          background: "linear-gradient(135deg, #E8436C 0%, #FF6B8A 100%)",
          boxShadow: "0 4px 18px rgba(232, 67, 108, 0.50), 0 1px 4px rgba(255, 107, 138, 0.30)",
        }}
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
        Réserver sur {platform}
        <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </a>

      {/* Bouton "Acheter ce véhicule" — conditionnel */}
      {achatHref && (
        <a
          href={achatHref}
          className="btn-shine inline-flex items-center justify-center gap-2 w-full font-semibold text-white py-3 px-5 rounded-2xl text-sm active:scale-95 transition-transform"
          style={{
            background: "linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)",
            boxShadow: "0 4px 14px rgba(59, 130, 246, 0.40)",
          }}
        >
          🔑 Acheter ce véhicule
        </a>
      )}

      {/* Assurance */}
      {insuranceIncluded && (
        <p className="text-center text-xs text-emerald-600 font-medium">
          ✓{" "}
          <a
            href="https://www.yescapa.fr/aide/assurance-et-assistance-24-7-locataire/comment-fonctionne-lassurance/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted underline-offset-2 hover:opacity-70 transition-opacity"
          >
            Assurance tous risques incluse
          </a>{" "}
          dans votre réservation
        </p>
      )}
    </div>
  );
}
