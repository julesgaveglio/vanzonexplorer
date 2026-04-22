import Link from "next/link";
import { buildVslUrl, VSL_TITLE } from "@/lib/constants/vsl";

interface VSLHeroBannerProps {
  articleSlug: string;
}

export default function VSLHeroBanner({ articleSlug }: VSLHeroBannerProps) {
  return (
    <div
      className="rounded-2xl p-5 mb-8"
      style={{
        background: "linear-gradient(135deg, rgba(185,148,95,0.08) 0%, rgba(228,211,152,0.08) 100%)",
        border: "1px solid rgba(185,148,95,0.18)",
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(185,148,95,0.12)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B9945F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 leading-snug">
            {VSL_TITLE}
          </p>
          <Link
            href={buildVslUrl(1, articleSlug)}
            className="inline-block mt-2 text-sm font-semibold transition-colors"
            style={{ color: "#B9945F" }}
          >
            Regarder maintenant →
          </Link>
        </div>
      </div>
    </div>
  );
}
