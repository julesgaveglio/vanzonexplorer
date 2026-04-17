import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import LiquidButton from "@/components/ui/LiquidButton";
import CalendlyButton from "@/components/ui/CalendlyButton";
import { sanityFetch } from "@/lib/sanity/client";
import { groq } from "next-sanity";
import { getBrands } from "@/lib/club/data";

export const metadata: Metadata = {
  title: "À propos — Vanzon Explorer | Écosystème Vanlife Pays Basque",
  description:
    "Vanzon Explorer : l'écosystème vanlife 360° qui rend la liberté accessible à tous. Location, achat, formation et Club au Pays Basque et partout en France. Fondé en 2024 par Jules et Elio.",
  alternates: {
    canonical: "https://vanzonexplorer.com/a-propos",
  },
};

// ── Requêtes dynamiques ──────────────────────────────────────────
const locationVansCountQuery = groq`
  count(*[_type == "van" && "location" in offerType && status == "available"])
`;

const SERVICES = [
  {
    icon: "🚐",
    label: "Location",
    title: "Vans aménagés à louer",
    desc: "Explorez le Pays Basque à bord d'un van entièrement équipé. Liberté totale, sans contrainte.",
    zone: "Pays Basque",
    href: "/location",
    color: "bg-blue-50 text-blue-600",
    border: "hover:border-blue-200",
  },
  {
    icon: "🔑",
    label: "Achat",
    title: "Votre van sur mesure",
    desc: "Vous cherchez votre propre van ? On vous accompagne dans le choix, la négociation et la livraison.",
    zone: "Toute la France",
    href: "/achat",
    color: "bg-emerald-50 text-emerald-600",
    border: "hover:border-emerald-200",
  },
  {
    icon: "🎓",
    label: "Formation",
    title: "Formation Van Business",
    desc: "Aménagement, mise en location, rentabilité. Un programme complet pour construire un projet solide.",
    zone: "Toute la France",
    href: "/formation",
    color: "bg-violet-50 text-violet-600",
    border: "hover:border-violet-200",
  },
  {
    icon: "🔒",
    label: "Club",
    title: "Deals & marques partenaires",
    desc: "Codes promo exclusifs chez nos marques partenaires validées. Parce que la liberté ne devrait pas coûter cher.",
    zone: "Toute la France",
    href: "/club",
    color: "bg-amber-50 text-amber-600",
    border: "hover:border-amber-200",
  },
];

const VALUES = [
  {
    icon: "🌍",
    title: "Accessibilité",
    desc: "La liberté et le voyage ne devraient pas être réservés à une élite. Chaque service est pensé pour rendre la vanlife accessible au plus grand nombre.",
  },
  {
    icon: "🤝",
    title: "Authenticité",
    desc: "On ne vend que ce qu'on a testé et validé nous-mêmes — vans, marques partenaires, méthodes. Zéro compromis sur la qualité.",
  },
  {
    icon: "🎯",
    title: "Accompagnement",
    desc: "De l'idée initiale à la route, on reste présents. Pas une vente, une relation. On s'investit dans le succès de chaque projet.",
  },
  {
    icon: "✨",
    title: "Qualité",
    desc: "Chaque van de notre flotte, chaque marque du Club passe par un processus de sélection rigoureux. Votre confiance se mérite.",
  },
];

export default async function AProposPage() {
  // Données dynamiques
  const [vanCount, brands] = await Promise.all([
    sanityFetch<number>(locationVansCountQuery).catch(() => null),
    getBrands({ partnerOnly: true }).catch(() => []),
  ]);

  const fleetCount = vanCount ?? 2;
  const brandCount = brands.length > 0 ? brands.length : "—";

  return (
    <>
      {/* ══════════════════════════════════════════════
          HERO ENTREPRISE
      ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white pt-20 pb-16 md:pt-28 md:pb-20">
        {/* Fond subtil */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59,130,246,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Fondé en 2024 · Pays Basque
          </span>

          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[0.9] tracking-tight">
            Vanzon Explorer
          </h1>
          <p className="mt-6 text-xl md:text-2xl font-light text-slate-400 leading-relaxed max-w-2xl mx-auto">
            L&apos;écosystème vanlife qui rend{" "}
            <span className="font-semibold text-slate-700">le goût de la liberté</span>{" "}
            accessible à tous.
          </p>

          {/* Indicateur de défilement */}
          <div className="mt-12 flex justify-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-px h-10 bg-gradient-to-b from-transparent to-slate-200" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          STATS DYNAMIQUES
      ══════════════════════════════════════════════ */}
      <section className="border-y border-slate-100 bg-slate-50 py-10">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: fleetCount, label: "vans en location", sub: "Pays Basque" },
              { value: brandCount, label: "marques partenaires", sub: "Club" },
              { value: "20+", label: "locations réalisées", sub: "et ça grandit" },
              { value: "2024", label: "année de création", sub: "Cambo-les-Bains, Pays Basque" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center">
                <span className="text-4xl md:text-5xl font-black text-slate-900 leading-none">
                  {s.value}
                </span>
                <span className="mt-2 text-sm font-semibold text-slate-600">{s.label}</span>
                <span className="mt-0.5 text-xs text-slate-400">{s.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          L'HISTOIRE
      ══════════════════════════════════════════════ */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">

            {/* Texte */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500 mb-4 block">
                Notre histoire
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-6">
                Née d&apos;un tour du monde,<br />
                portée par une mémoire.
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Tout a commencé en <strong className="text-slate-800">2024</strong>, quand Jules rentre de son tour du monde avec une envie simple : garder cette liberté, ce mode de vie, ce goût du voyage. Il investit ses économies dans un van aménagé.
                </p>
                <p>
                  C&apos;est à ce moment qu&apos;il rencontre <strong className="text-slate-800">Elio</strong>, déjà propriétaire de son propre van. Une passion commune, deux compétences complémentaires. Ensemble, ils investissent dans un second fourgon et posent les bases de Vanzon Explorer.
                </p>
                <p>
                  <strong className="text-slate-800">Pourquoi Vanzon ?</strong><br />
                  Le nom de l&apos;entreprise porte une signification profonde. Il est né après le décès de la mère de Jules, passionnée de voyage. En néerlandais, <em>&laquo;&nbsp;van zon&nbsp;&raquo;</em> signifie <em>&laquo;&nbsp;du soleil&nbsp;&raquo;</em>. C&apos;est exactement ce que représentait <strong className="text-slate-800">Sandra Vanzon</strong>. Ce nom est paru comme une évidence : un hommage lumineux, une manière de faire perdurer sa mémoire.
                </p>
                <blockquote className="border-l-2 border-blue-200 pl-4">
                  <p className="text-slate-500 italic">
                    &ldquo;Rendre accessible à tous le goût de la liberté.&rdquo;
                  </p>
                  <footer className="mt-1 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    — Vanzon Explorer
                  </footer>
                </blockquote>
              </div>
            </div>

            {/* Visuel — grille de photos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                <Image
                  src="https://cdn.sanity.io/images/lewexa74/production/16f9120e659bdd4bba47e663e9df9a1a9293fe3f-1170x2080.jpg?auto=format&q=82"
                  alt="Jules, fondateur de Vanzon Explorer"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-3">
                <div className="relative aspect-square rounded-2xl overflow-hidden">
                  <Image
                    src="https://cdn.sanity.io/images/lewexa74/production/28a2c5acbe2ee16169d4ace1ab0522481c43d356-1170x2080.jpg?auto=format&q=82"
                    alt="Jules et Elio, co-fondateurs Vanzon Explorer"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative aspect-square rounded-2xl overflow-hidden">
                  <Image
                    src="https://cdn.sanity.io/images/lewexa74/production/325f3ebf1d68fd890487229864c73cc65bef20d3-1186x1654.png?auto=format&q=82"
                    alt="Elio, co-fondateur Vanzon Explorer"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SÉPARATEUR
      ══════════════════════════════════════════════ */}
      <div className="bg-slate-50 py-10">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">L&apos;équipe</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          JULES & ELIO
      ══════════════════════════════════════════════ */}

      {/* Profils */}
      <section className="bg-[#F8FAFC] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500 mb-4 block">
              Les fondateurs
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">Jules &amp; Elio</h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">
              Tous les deux animés par la même envie de liberté, de voyage et de vie en van.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Jules */}
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900">Jules</h3>
                <span className="text-sm text-blue-600 font-medium">Président &amp; Co-fondateur</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Jules est tourné vers la stratégie et l&apos;innovation.{" "}
                <strong className="text-slate-800">Business model, marketing, mise en location, rentabilité</strong>{" "}
                — il apporte la vision entrepreneuriale pour transformer un van aménagé en véritable source de revenus. Il maîtrise aussi l&apos;IA pour automatiser les tâches techniques et marketing.
              </p>
              <div className="flex flex-wrap gap-2 mt-6">
                {["Business", "Marketing", "IA", "Location", "Rentabilité"].map((tag) => (
                  <span key={tag} className="text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Elio */}
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900">Elio</h3>
                <span className="text-sm text-amber-600 font-medium">Directeur Général &amp; Co-fondateur</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Elio est le spécialiste du concret et surtout de la mécanique. C&apos;est lui qui vous aide à{" "}
                <strong className="text-slate-800">choisir le bon fourgon dès le départ</strong>, éviter les erreurs qui coûtent très cher, analyser l&apos;état réel d&apos;un véhicule, négocier au bon prix et viser le meilleur rapport qualité-prix.
              </p>
              <div className="flex flex-wrap gap-2 mt-6">
                {["Mécanique", "Aménagement", "Choix fourgon", "Négociation"].map((tag) => (
                  <span key={tag} className="text-xs font-medium bg-amber-50 text-amber-700 px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission commune */}
      <section className="bg-white py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900">Un projet commun</h2>
          </div>
          <p className="text-slate-600 leading-relaxed text-lg text-center">
            Ensemble, ils accompagnent chaque participant{" "}
            <strong className="text-slate-900">de A à Z</strong> — de l&apos;idée initiale jusqu&apos;à la mise sur la route et au-delà. L&apos;objectif n&apos;est pas seulement de construire un van, mais de{" "}
            <strong className="text-slate-900">bâtir un projet solide long terme, rentable et aligné avec un mode de vie plus libre.</strong>
          </p>
          <div className="flex gap-4 mt-10 justify-center flex-wrap">
            <CalendlyButton>
              📅 Réserver un appel gratuit →
            </CalendlyButton>
            <LiquidButton variant="ghost" href="/location">Louer un van</LiquidButton>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          NOS 4 SERVICES
      ══════════════════════════════════════════════ */}
      <section className="bg-slate-50 py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500 mb-4 block">
              L&apos;écosystème
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">
              Un service pour chaque projet
            </h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">
              Louer, acheter, se former ou économiser sur son aménagement — on a pensé à tout.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICES.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className={`group relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${s.border}`}
              >
                <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl text-xl mb-4 ${s.color.split(" ")[0]}`}>
                  {s.icon}
                </div>
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${s.color.split(" ")[1]}`}>
                  {s.label}
                </p>
                <h3 className="text-sm font-bold text-slate-900 leading-snug mb-2">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {s.zone}
                  </span>
                  <span className={`text-xs font-semibold transition-transform duration-200 group-hover:translate-x-0.5 ${s.color.split(" ")[1]}`}>
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          NOS VALEURS
      ══════════════════════════════════════════════ */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500 mb-4 block">
              Ce qu&apos;on défend
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">Nos engagements</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="flex flex-col">
                <span className="text-2xl mb-3">{v.icon}</span>
                <h3 className="text-base font-bold text-slate-900 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Vanzon Explorer",
            url: "https://vanzonexplorer.com",
            logo: "https://cdn.sanity.io/images/lewexa74/production/1f483103ef15ee3549eab14ba2801d11b32a9055-313x313.png?auto=format&q=82",
            description:
              "Écosystème vanlife 360° — location, achat, formation et Club au Pays Basque. Fondé en 2024 par Jules Gaveglio et Elio.",
            foundingDate: "2024-01-01",
            foundingLocation: { "@type": "Place", name: "Cambo-les-Bains, Pays Basque, France" },
            areaServed: "FR",
            employee: [
              {
                "@type": "Person",
                name: "Jules Gaveglio",
                jobTitle: "Président & Co-fondateur",
                description:
                  "Stratégie, business, marketing et mise en location. Retour de tour du monde 2024.",
                url: "https://vanzonexplorer.com/a-propos",
                worksFor: { "@type": "Organization", name: "Vanzon Explorer" },
              },
              {
                "@type": "Person",
                name: "Elio",
                jobTitle: "Directeur Général & Co-fondateur",
                description:
                  "Expert mécanique et aménagement van. Spécialiste sourcing et négociation.",
                url: "https://vanzonexplorer.com/a-propos",
                worksFor: { "@type": "Organization", name: "Vanzon Explorer" },
              },
            ],
            sameAs: [
              "https://www.instagram.com/vanzonexplorer",
              "https://www.youtube.com/@vanzonexplorer",
              "https://www.tiktok.com/@vanzonexplorer",
              "https://www.trustpilot.com/review/vanzonexplorer.com",
            ],
          }),
        }}
      />
    </>
  );
}
