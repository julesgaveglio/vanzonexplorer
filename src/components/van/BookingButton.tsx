import LiquidButton from "@/components/ui/LiquidButton";

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
      <LiquidButton
        variant={platform.toLowerCase().includes("wikicampers") ? "orange" : "rose"}
        size="md"
        href={url}
        external
        fullWidth
      >
        Réserver sur {platform}
        <svg className="w-3.5 h-3.5 opacity-80 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </LiquidButton>

      {/* Bouton "Acheter ce véhicule" — conditionnel */}
      {achatHref && (
        <LiquidButton
          variant="blue"
          size="md"
          href={achatHref}
          fullWidth
        >
          🔑 Acheter ce véhicule
        </LiquidButton>
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
