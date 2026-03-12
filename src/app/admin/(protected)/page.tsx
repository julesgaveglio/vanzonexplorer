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

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: "Disponible", color: "#10B981", bg: "#ECFDF5" },
  reserved: { label: "Reserve", color: "#F59E0B", bg: "#FFFBEB" },
  sold: { label: "Vendu", color: "#EF4444", bg: "#FEF2F2" },
  preparing: { label: "En preparation", color: "#3B82F6", bg: "#EFF6FF" },
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
      total: `/ ${data?.totalVans ?? 0} total`,
      icon: "🚐",
      gradient: "from-blue-500 to-sky-400",
      href: "/admin/vans",
    },
    {
      label: "Vans a vendre",
      value: data?.achatVans ?? 0,
      total: "actifs",
      icon: "🔑",
      gradient: "from-amber-500 to-yellow-400",
      href: "/admin/vans",
    },
    {
      label: "Temoignages",
      value: data?.totalTestimonials ?? 0,
      total: `${data?.featuredTestimonials ?? 0} mis en avant`,
      icon: "💬",
      gradient: "from-teal-500 to-cyan-400",
      href: "/admin/testimonials",
    },
    {
      label: "Spots Pays Basque",
      value: data?.totalSpots ?? 0,
      total: "references",
      icon: "📍",
      gradient: "from-purple-500 to-violet-400",
      href: "/admin/spots",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-slate-400 text-sm font-medium mb-1">Administration</p>
        <h1 className="text-3xl font-black text-slate-900">
          Bonjour, {firstName}
        </h1>
        <p className="text-slate-500 mt-1">
          Voici un apercu de votre contenu Vanzon Explorer.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-xl mb-4 shadow-sm`}>
              {stat.icon}
            </div>
            <p className="text-3xl font-black text-slate-900">{stat.value}</p>
            <p className="text-sm font-semibold text-slate-700 mt-1">{stat.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{stat.total}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Vans recents */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="font-bold text-slate-900">Vans recents</h2>
            <Link href="/admin/vans" className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors">
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {(data?.recentVans ?? []).map((van) => {
              const status = statusConfig[van.status] ?? statusConfig.available;
              const isLocation = van.offerType?.includes("location");
              return (
                <div key={van._id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/60 transition-colors">
                  {/* Image */}
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                    {van.img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`${van.img}?w=80&h=80&fit=crop&auto=format`} alt={van.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{van.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {isLocation ? `${van.startingPricePerNight ?? "—"} €/nuit` : `${van.salePrice ? `${van.salePrice.toLocaleString("fr-FR")} €` : "—"}`}
                    </p>
                  </div>
                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {van.featured && (
                      <span className="text-amber-400 text-sm" title="Mis en avant">★</span>
                    )}
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded-lg"
                      style={{ color: status.color, background: status.bg }}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
            {(!data?.recentVans || data.recentVans.length === 0) && (
              <p className="px-6 py-8 text-center text-slate-400 text-sm">Aucun van dans Sanity</p>
            )}
          </div>
        </div>

        {/* Panel droit */}
        <div className="flex flex-col gap-4">
          {/* Temoignages recents */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <h2 className="font-bold text-slate-900 text-sm">Derniers temoignages</h2>
              <Link href="/admin/testimonials" className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors">
                Voir tout
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {(data?.recentTestimonials ?? []).map((t) => (
                <div key={t._id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                    <span className="text-amber-400 text-xs">{"★".repeat(t.rating)}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{t.content}</p>
                </div>
              ))}
              {(!data?.recentTestimonials || data.recentTestimonials.length === 0) && (
                <p className="px-5 py-6 text-center text-slate-400 text-xs">Aucun temoignage</p>
              )}
            </div>
          </div>

          {/* Acces rapides */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h2 className="font-bold text-slate-900 text-sm mb-3">Acces rapides</h2>
            <div className="space-y-2">
              {[
                { label: "Ajouter un van", href: "/studio/structure/van;new", icon: "+" },
                { label: "Ajouter un temoignage", href: "/studio/structure/testimonial;new", icon: "+" },
                { label: "Modifier Hero Carousel", href: "/studio/structure/heroImages", icon: "→" },
                { label: "Parametres du site", href: "/admin/settings", icon: "→" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("/studio") ? "_blank" : undefined}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-all text-sm font-medium text-slate-700 group"
                >
                  <span>{link.label}</span>
                  <span className="text-slate-300 group-hover:text-blue-400 transition-colors font-mono">{link.icon}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
