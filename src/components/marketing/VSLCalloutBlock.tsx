import Link from "next/link";
import { buildVslUrl, VSL_BULLETS } from "@/lib/constants/vsl";

interface VSLCalloutBlockProps {
  articleSlug: string;
}

export default function VSLCalloutBlock({ articleSlug }: VSLCalloutBlockProps) {
  return (
    <div
      className="rounded-3xl overflow-hidden my-12"
      style={{
        background: "#0F172A",
      }}
    >
      <div className="px-6 py-8 sm:px-8">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(185,148,95,0.20)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E4D398" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Video gratuite
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug mb-2">
          Avant de te lancer, regarde cette video
        </h3>
        <p className="text-sm text-white/50 mb-6">
          Evite les erreurs qui coutent des milliers d&apos;euros et decouvre comment rentabiliser ton van.
        </p>

        <div className="space-y-3 mb-8">
          {VSL_BULLETS.map((bullet) => (
            <div key={bullet} className="flex items-start gap-2.5">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span className="text-sm text-white/70">{bullet}</span>
            </div>
          ))}
        </div>

        <Link
          href={buildVslUrl(3, articleSlug)}
          className="block w-full text-center font-bold text-white py-4 rounded-xl text-base transition-all hover:scale-[1.02] hover:shadow-lg"
          style={{
            background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
            boxShadow: "0 4px 18px rgba(185, 148, 95, 0.45)",
          }}
        >
          Acceder a la video gratuite →
        </Link>
      </div>
    </div>
  );
}
