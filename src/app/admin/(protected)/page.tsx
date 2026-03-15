import { adminReadClient } from "@/lib/sanity/adminClient";
import { groq } from "next-sanity";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

const dashboardQuery = groq`{
  "totalVans": count(*[_type == "van"]),
  "locationVans": count(*[_type == "van" && "location" in offerType && status == "available"]),
  "achatVans": count(*[_type == "van" && "achat" in offerType && status != "sold"]),
  "totalTestimonials": count(*[_type == "testimonial"]),
  "featuredTestimonials": count(*[_type == "testimonial" && featured == true]),
  "totalSpots": count(*[_type == "spotPaysBasque"]),
  "recentVans": *[_type == "van"] | order(_updatedAt desc)[0...6] {
    _id,
    name,
    status,
    offerType,
    featured,
    startingPricePerNight,
    salePrice,
    "img": mainImage.asset->url,
    _updatedAt
  },
  "recentTestimonials": *[_type == "testimonial"] | order(_createdAt desc)[0...4] {
    _id,
    name,
    role,
    rating,
    content,
    featured
  }
}`;

type DashboardData = {
  totalVans: number;
  locationVans: number;
  achatVans: number;
  totalTestimonials: number;
  featuredTestimonials: number;
  totalSpots: number;
  recentVans: {
    _id: string;
    name: string;
    status: string;
    offerType: string[];
    featured: boolean;
    startingPricePerNight?: number;
    salePrice?: number;
    img?: string;
    _updatedAt: string;
  }[];
  recentTestimonials: {
    _id: string;
    name: string;
    role?: string;
    rating: number;
    content: string;
    featured: boolean;
  }[];
};

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  available: { label: "Disponible", color: "#059669", bg: "#ECFDF5", dot: "bg-emerald-400" },
  reserved:  { label: "Réservé",    color: "#D97706", bg: "#FFFBEB", dot: "bg-amber-400"  },
  sold:      { label: "Vendu",      color: "#DC2626", bg: "#FEF2F2", dot: "bg-red-400"    },
  preparing: { label: "En prépa",   color: "#2563EB", bg: "#EFF6FF", dot: "bg-blue-400"   },
};

export default async function AdminDashboard() {
  const [data, user] = await Promise.all([
    adminReadClient.fetch<DashboardData>(dashboardQuery),
    currentUser(),
  ]);

  const firstName = user?.firstName ?? "Jules";

  const stats = [
    {
      label: "Vans en location",
      value: data?.locationVans ?? 0,
      sub: `sur ${data?.totalVans ?? 0} total`,
      icon: "🚐",
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/admin/vans",
    },
    {
      label: "Vans à vendre",
      value: data?.achatVans ?? 0,
      sub: "actifs",
      icon: "🔑",
      color: "text-amber-600",
      bg: "bg-amber-50",
      href: "/admin/vans",
    },
    {
      label: "Témoignages",
      value: data?.totalTestimonials ?? 0,
      sub: `${data?.featuredTestimonials ?? 0} mis en avant`,
      icon: "💬",
      color: "text-teal-600",
      bg: "bg-teal-50",
      href: "/admin/testimonials",
    },
    {
      label: "Spots Pays Basque",
      value: data?.totalSpots ?? 0,
      sub: "référencés",
      icon: "📍",
      color: "text-violet-600",
      bg: "bg-violet-50",
      href: "/admin/spots",
    },
  ];

  const quickLinks = [
    { label: "Ajouter un van", href: "/studio/structure/van;new", external: true },
    { label: "Ajouter un témoignage", href: "/studio/structure/testimonial;new", external: true },
    { label: "Modifier le Hero Carousel", href: "/studio/structure/heroImages", external: true },
    { label: "Paramètres du site", href: "/admin/settings", external: false },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-screen-xl mx-auto">

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Administration</p>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Bonjour, {firstName} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Aperçu de votre contenu Vanzon Explorer.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${stat.bg} flex items-center justify-center text-lg sm:text-xl mb-3 sm:mb-4`}>
              {stat.icon}
            </div>
            <p className={`text-2xl sm:text-3xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5 leading-tight">{stat.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
          </Link>
        ))}
      </div>

      {/* Contenu principal */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Vans récents */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">Vans récents</h2>
            <Link href="/admin/vans" className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors">
              Voir tout →
            </Link>
          </div>
          {/* Scroll horizontal sur mobile pour les tableaux */}
          <div className="overflow-x-auto">
            <div className="min-w-[400px]">
              {(data?.recentVans ?? []).map((van) => {
                const status = statusConfig[van.status] ?? statusConfig.available;
                const isLocation = van.offerType?.includes("location");
                const price = isLocation
                  ? `${van.startingPricePerNight ?? "—"} €/nuit`
                  : van.salePrice
                    ? `${van.salePrice.toLocaleString("fr-FR")} €`
                    : "—";

                return (
                  <Link
                    key={van._id}
                    href={`/admin/vans/${van._id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors border-b border-slate-50 last:border-0"
                  >
                    {/* Image */}
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                      {van.img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`${van.img}?w=72&h=72&fit=crop&auto=format`}
                          alt={van.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-slate-300 text-xs">🚐</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{van.name}</p>
                      <p className="text-xs text-slate-400">{price}</p>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {van.featured && (
                        <span className="text-amber-400 text-xs" title="Mis en avant">★</span>
                      )}
                      <span
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: status.color, background: status.bg }}
                      >
                        <span className={`w-1 h-1 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
              {(!data?.recentVans || data.recentVans.length === 0) && (
                <p className="px-5 py-10 text-center text-slate-400 text-sm">Aucun van dans Sanity</p>
              )}
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-4">

          {/* Témoignages récents */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <h2 className="font-bold text-slate-900 text-sm">Derniers témoignages</h2>
              <Link href="/admin/testimonials" className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors">
                Voir tout →
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {(data?.recentTestimonials ?? []).map((t) => (
                <div key={t._id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{t.name}</p>
                    <span className="text-amber-400 text-xs flex-shrink-0 ml-2">
                      {"★".repeat(Math.min(t.rating, 5))}
                    </span>
                  </div>
                  {t.role && <p className="text-xs text-slate-400 mb-1">{t.role}</p>}
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{t.content}</p>
                </div>
              ))}
              {(!data?.recentTestimonials || data.recentTestimonials.length === 0) && (
                <p className="px-5 py-6 text-center text-slate-400 text-xs">Aucun témoignage</p>
              )}
            </div>
          </div>

          {/* Accès rapides */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-bold text-slate-900 text-sm mb-3">Accès rapides</h2>
            <div className="space-y-1.5">
              {quickLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 transition-all text-sm font-medium text-slate-600 group"
                >
                  <span className="truncate">{link.label}</span>
                  <svg
                    className="w-3.5 h-3.5 flex-shrink-0 ml-2 text-slate-300 group-hover:text-blue-400 transition-colors"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                  >
                    {link.external
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      : <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    }
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Liens outils */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-2">Outils externes</p>
            <div className="space-y-2">
              {[
                { label: "Sanity Studio", href: "/studio" },
                { label: "Google Analytics", href: "https://analytics.google.com" },
                { label: "Google Search Console", href: "https://search.google.com/search-console" },
                { label: "Vercel Dashboard", href: "https://vercel.com" },
              ].map((tool) => (
                <a
                  key={tool.label}
                  href={tool.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-sm font-medium text-white/80 hover:text-white transition-colors py-1"
                >
                  <span>{tool.label}</span>
                  <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
