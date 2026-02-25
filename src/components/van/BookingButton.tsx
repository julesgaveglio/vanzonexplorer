interface BookingButtonProps {
  url: string;
  platform: string;
  insuranceIncluded?: boolean;
}

export default function BookingButton({
  url,
  platform,
  insuranceIncluded = true,
}: BookingButtonProps) {
  return (
    <div className="flex flex-col gap-2">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary flex items-center justify-center gap-2 w-full"
      >
        <svg
          className="w-[18px] h-[18px]"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
          />
        </svg>
        Réserver maintenant
        <span className="text-xs opacity-75">via {platform}</span>
      </a>
      {insuranceIncluded && (
        <p className="text-center text-xs text-emerald-600 font-medium">
          ✓ Assurance tous risques incluse dans votre réservation
        </p>
      )}
      <p className="text-center text-xs text-slate-400">
        Vous serez redirigé vers {platform} pour voir les disponibilités et le
        prix exact selon vos dates.
      </p>
    </div>
  );
}
