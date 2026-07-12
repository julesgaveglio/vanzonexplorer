// Section FAQ réutilisable + schema FAQPage JSON-LD (GEO).
// Server Component — le contenu est visible dans le HTML statique,
// formulé en questions conversationnelles avec réponses autonomes et
// chiffrées : le format le plus cité par les moteurs de recherche IA.

type Accent = "blue" | "gold";

export interface GeoFaqItem {
  q: string;
  a: string;
}

const ACCENT_STYLES: Record<Accent, { sectionBg: string; border: string }> = {
  blue: {
    sectionBg: "linear-gradient(160deg, #F8FAFC 0%, #EFF6FF 100%)",
    border: "border-slate-100",
  },
  gold: {
    sectionBg: "linear-gradient(160deg, #FFFFFF 0%, #FAF6F0 100%)",
    border: "border-[rgba(185,148,95,0.15)]",
  },
};

export default function GeoFaqSection({
  title = "Questions fréquentes",
  subtitle,
  items,
  accent = "blue",
}: {
  title?: string;
  subtitle?: string;
  items: GeoFaqItem[];
  accent?: Accent;
}) {
  const styles = ACCENT_STYLES[accent];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <section className="py-20" style={{ background: styles.sectionBg }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-slate-900 mb-3">{title}</h2>
          {subtitle && <p className="text-slate-500 text-lg">{subtitle}</p>}
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <details
              key={item.q}
              className={`group bg-white rounded-2xl border ${styles.border} shadow-sm overflow-hidden`}
            >
              <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none select-none">
                <h3 className="font-semibold text-slate-900 text-base">{item.q}</h3>
                <span className="flex-shrink-0 w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-open:rotate-180 transition-transform duration-200 text-sm font-bold">
                  ↓
                </span>
              </summary>
              <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-50 pt-4">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
