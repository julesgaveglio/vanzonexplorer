import { Metadata } from "next";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { ReviewActions } from "./ReviewActions";
import { ContactedToggle } from "./ContactedToggle";

export const metadata: Metadata = {
  title: "Road Trips — Vanzon Admin",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 50;

interface SearchParams {
  status?: string;
  region?: string;
  van_status?: string;
  overnight?: string;
  contacted?: string;
  page?: string;
  tab?: string;
}

interface RoadTripRequest {
  id: string;
  prenom: string;
  email: string;
  region: string;
  duree: number;
  interets: string[];
  style_voyage: string;
  periode: string;
  profil_voyageur: string;
  budget: string;
  experience_van: boolean;
  itineraire_json: Record<string, unknown> | null;
  status: "pending" | "sent" | "error" | "review" | "published";
  created_at: string;
  sent_at: string | null;
  article_sanity_id?: string | null;
  article_slug?: string | null;
  region_slug?: string | null;
  quality_score?: number | null;
  // v2 lead fields
  lead_firstname?: string | null;
  lead_email?: string | null;
  van_status?: "proprietaire" | "locataire" | "non_precise" | null;
  group_type?: string | null;
  budget_level?: string | null;
  overnight_preference?: "gratuit" | "aires_officielles" | "camping" | "mix" | null;
  contacted?: boolean | null;
}

function VanStatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-slate-300 text-xs">—</span>;
  const styles: Record<string, string> = {
    proprietaire: "bg-green-100 text-green-800 border border-green-200",
    locataire: "bg-blue-100 text-blue-800 border border-blue-200",
    non_precise: "bg-slate-100 text-slate-600 border border-slate-200",
  };
  const labels: Record<string, string> = {
    proprietaire: "Propriétaire",
    locataire: "Locataire",
    non_precise: "N/C",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-slate-100 text-slate-600"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function OvernightBadge({ pref }: { pref?: string | null }) {
  if (!pref) return <span className="text-slate-300 text-xs">—</span>;
  const labels: Record<string, string> = {
    gratuit: "🆓 Gratuit",
    aires_officielles: "⚡ Aires",
    camping: "🏕️ Camping",
    mix: "🔀 Mix",
  };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
      {labels[pref] ?? pref}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    sent: "bg-green-100 text-green-800 border border-green-200",
    error: "bg-red-100 text-red-800 border border-red-200",
    review: "bg-blue-100 text-blue-800 border border-blue-200",
    published: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  };
  const labels: Record<string, string> = {
    pending: "En attente",
    sent: "Envoyé",
    error: "Erreur",
    review: "En review",
    published: "Publié",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-slate-100 text-slate-700"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function QualityBadge({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined)
    return <span className="text-slate-300 text-xs">—</span>;
  const color =
    score >= 70
      ? "bg-green-100 text-green-800"
      : score >= 50
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      {score}/100
    </span>
  );
}

export default async function RoadTripsAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createSupabaseAdmin();
  const currentTab = searchParams.tab ?? "demandes";

  // --- Stats ---
  const [{ count: total }, { count: todaySent }, , { count: reviewCount }, { count: publishedCount }] =
    await Promise.all([
      supabase
        .from("road_trip_requests")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("road_trip_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent")
        .gte("sent_at", new Date().toISOString().split("T")[0]),
      supabase
        .from("road_trip_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent"),
      supabase
        .from("road_trip_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "review"),
      supabase
        .from("road_trip_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "published"),
    ]);


  // --- Review/Published articles ---
  let reviewRows: RoadTripRequest[] = [];
  if (currentTab === "review" || currentTab === "published") {
    const statusFilter = currentTab === "published" ? "published" : "review";
    const { data } = await supabase
      .from("road_trip_requests")
      .select("*")
      .eq("status", statusFilter)
      .not("article_sanity_id", "is", null)
      .order("created_at", { ascending: false });
    reviewRows = (data as RoadTripRequest[] | null) ?? [];
  }

  // --- Table query (demandes tab) ---
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const offset = (page - 1) * PAGE_SIZE;

  let rows: RoadTripRequest[] | null = null;
  let filteredCount: number | null = null;
  let totalPages = 1;

  if (currentTab === "demandes") {
    let query = supabase
      .from("road_trip_requests")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (searchParams.status && searchParams.status !== "all") {
      query = query.eq("status", searchParams.status);
    }
    if (searchParams.region) {
      query = query.ilike("region", `%${searchParams.region}%`);
    }
    if (searchParams.van_status && searchParams.van_status !== "all") {
      query = query.eq("van_status", searchParams.van_status);
    }
    if (searchParams.overnight && searchParams.overnight !== "all") {
      query = query.eq("overnight_preference", searchParams.overnight);
    }
    if (searchParams.contacted === "true") {
      query = query.eq("contacted", true);
    } else if (searchParams.contacted === "false") {
      query = query.eq("contacted", false);
    }

    const result = await query;
    rows = result.data as RoadTripRequest[] | null;
    filteredCount = result.count;
    totalPages = Math.ceil((filteredCount ?? 0) / PAGE_SIZE);
  }

  // Build filter URL helpers
  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      status: searchParams.status ?? "all",
      region: searchParams.region ?? "",
      van_status: searchParams.van_status ?? "all",
      overnight: searchParams.overnight ?? "all",
      contacted: searchParams.contacted ?? "",
      page: String(page),
      tab: currentTab,
      ...overrides,
    };
    if (merged.tab && merged.tab !== "demandes") params.set("tab", merged.tab);
    if (merged.status && merged.status !== "all")
      params.set("status", merged.status);
    if (merged.region) params.set("region", merged.region);
    if (merged.van_status && merged.van_status !== "all")
      params.set("van_status", merged.van_status);
    if (merged.overnight && merged.overnight !== "all")
      params.set("overnight", merged.overnight);
    if (merged.contacted) params.set("contacted", merged.contacted);
    if (merged.page && merged.page !== "1") params.set("page", merged.page);
    const qs = params.toString();
    return `/admin/road-trips${qs ? `?${qs}` : ""}`;
  }

  const currentStatus = searchParams.status ?? "all";
  const currentRegion = searchParams.region ?? "";
  const currentVanStatus = searchParams.van_status ?? "all";
  const currentOvernight = searchParams.overnight ?? "all";
  const currentContacted = searchParams.contacted ?? "";
  const exportParams = new URLSearchParams();
  if (currentStatus !== "all") exportParams.set("status", currentStatus);
  if (currentVanStatus !== "all") exportParams.set("van_status", currentVanStatus);
  if (currentContacted) exportParams.set("contacted", currentContacted);
  const exportUrl = `/api/admin/road-trips/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">
            Administration
          </p>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">
            Road Trips
          </h1>
          <p className="text-slate-500 mt-1">
            {total ?? 0} demande{(total ?? 0) > 1 ? "s" : ""} au total
          </p>
        </div>
        <a
          href={exportUrl}
          className="inline-flex items-center gap-2 font-semibold text-white text-sm px-5 py-2.5 rounded-xl transition-all"
          style={{
            background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
            boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
          }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Exporter CSV
        </a>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-5 rounded-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
            Total demandes
          </p>
          <p className="text-3xl font-black text-slate-900">{total ?? 0}</p>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
            Envoyés aujourd&apos;hui
          </p>
          <p className="text-3xl font-black text-slate-900">
            {todaySent ?? 0}
          </p>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
            En review
          </p>
          <p className="text-3xl font-black text-blue-600">{reviewCount ?? 0}</p>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
            Articles publiés
          </p>
          <p className="text-3xl font-black text-emerald-600">{publishedCount ?? 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        {(["demandes", "review", "published"] as const).map((t) => (
          <a
            key={t}
            href={`/admin/road-trips${t !== "demandes" ? `?tab=${t}` : ""}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentTab === t
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "demandes"
              ? "Demandes"
              : t === "review"
                ? `En review${(reviewCount ?? 0) > 0 ? ` (${reviewCount})` : ""}`
                : `Publiés${(publishedCount ?? 0) > 0 ? ` (${publishedCount})` : ""}`}
          </a>
        ))}
      </div>

      {/* ── Tab: En review / Publiés ── */}
      {(currentTab === "review" || currentTab === "published") && (
        <div className="glass-card rounded-2xl overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60">
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Titre / Région
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Durée
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Qualité
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {reviewRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-slate-400 text-sm"
                    >
                      {currentTab === "review"
                        ? "Aucun article en attente de review"
                        : "Aucun article publié"}
                    </td>
                  </tr>
                )}
                {reviewRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/10 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {row.article_slug
                          ? row.article_slug.replace(/-/g, " ")
                          : row.region}
                      </div>
                      {row.region_slug && (
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          /road-trip/{row.region_slug}/{row.article_slug}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.duree}j</td>
                    <td className="px-4 py-3">
                      <QualityBadge score={row.quality_score} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(row.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      {currentTab === "review" ? (
                        <ReviewActions
                          sanityId={row.article_sanity_id!}
                          supabaseId={row.id}
                          regionSlug={row.region_slug ?? undefined}
                          articleSlug={row.article_slug ?? undefined}
                        />
                      ) : (
                        row.region_slug && row.article_slug ? (
                          <a
                            href={`https://vanzonexplorer.com/road-trip/${row.region_slug}/${row.article_slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold hover:bg-emerald-200 inline-block"
                          >
                            Voir l&apos;article →
                          </a>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Demandes ── */}
      {currentTab === "demandes" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Status filter */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {(["all", "pending", "sent", "error"] as const).map((s) => (
                <a
                  key={s}
                  href={buildUrl({ status: s, page: "1" })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    currentStatus === s
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {s === "all"
                    ? "Tous"
                    : s === "pending"
                      ? "En attente"
                      : s === "sent"
                        ? "Envoyés"
                        : "Erreurs"}
                </a>
              ))}
            </div>

            {/* Region filter */}
            <form method="GET" action="/admin/road-trips" className="flex gap-2">
              {currentStatus !== "all" && (
                <input type="hidden" name="status" value={currentStatus} />
              )}
              <input
                type="text"
                name="region"
                defaultValue={currentRegion}
                placeholder="Filtrer par région…"
                className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-48"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-300 transition-colors"
              >
                Filtrer
              </button>
              {currentRegion && (
                <a
                  href={buildUrl({ region: undefined, page: "1" })}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  ✕
                </a>
              )}
            </form>

            {/* Van status filter */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {(
                [
                  { v: "all", l: "Tous vans" },
                  { v: "proprietaire", l: "🔑 Propriétaires" },
                  { v: "locataire", l: "🚐 Locataires" },
                ] as const
              ).map((opt) => (
                <a
                  key={opt.v}
                  href={buildUrl({ van_status: opt.v, page: "1" })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    currentVanStatus === opt.v
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {opt.l}
                </a>
              ))}
            </div>

            {/* Overnight pref filter */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {(
                [
                  { v: "all", l: "Toutes nuits" },
                  { v: "gratuit", l: "🆓" },
                  { v: "aires_officielles", l: "⚡" },
                  { v: "camping", l: "🏕️" },
                  { v: "mix", l: "🔀" },
                ] as const
              ).map((opt) => (
                <a
                  key={opt.v}
                  href={buildUrl({ overnight: opt.v, page: "1" })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    currentOvernight === opt.v
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {opt.l}
                </a>
              ))}
            </div>

            {/* Contacted filter */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {(
                [
                  { v: "", l: "Tous contacts" },
                  { v: "false", l: "À contacter" },
                  { v: "true", l: "Contactés" },
                ] as const
              ).map((opt) => (
                <a
                  key={opt.v || "all"}
                  href={buildUrl({ contacted: opt.v || undefined, page: "1" })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    currentContacted === opt.v
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {opt.l}
                </a>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="glass-card rounded-2xl overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                      Prénom
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                      Région
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                      Durée
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                      Statut Van
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                      Nuit
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                      Profil
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                      Contacté
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                      Itinéraire
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(rows as RoadTripRequest[] | null)?.length === 0 && (
                    <tr>
                      <td
                        colSpan={12}
                        className="text-center py-12 text-slate-400 text-sm"
                      >
                        Aucune demande trouvée
                      </td>
                    </tr>
                  )}
                  {(rows as RoadTripRequest[] | null)?.map((row) => {
                    const jsonPreview = row.itineraire_json
                      ? JSON.stringify(row.itineraire_json).slice(0, 100)
                      : null;
                    const jsonFull = row.itineraire_json
                      ? JSON.stringify(row.itineraire_json, null, 2)
                      : null;
                    const displayFirstname = row.lead_firstname ?? row.prenom;
                    const displayEmail = row.lead_email ?? row.email;
                    const displayProfil = row.group_type ?? row.profil_voyageur;
                    const displayBudget = row.budget_level ?? row.budget;
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-white/10 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {displayFirstname}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                          {displayEmail}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{row.region}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.duree}j
                        </td>
                        <td className="px-4 py-3">
                          <VanStatusBadge status={row.van_status} />
                        </td>
                        <td className="px-4 py-3">
                          <OvernightBadge pref={row.overnight_preference} />
                        </td>
                        <td className="px-4 py-3 text-slate-600 capitalize">
                          {displayProfil}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{displayBudget}</td>
                        <td className="px-4 py-3">
                          <ContactedToggle
                            id={row.id}
                            initial={Boolean(row.contacted)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {new Date(row.created_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          {jsonFull ? (
                            <details className="cursor-pointer">
                              <summary className="text-xs text-slate-500 font-mono truncate max-w-[180px] list-none hover:text-slate-700 transition-colors">
                                <span className="underline underline-offset-2 decoration-dashed">
                                  {jsonPreview}
                                  {(JSON.stringify(row.itineraire_json)?.length ??
                                    0) > 100
                                    ? "…"
                                    : ""}
                                </span>
                              </summary>
                              <pre className="mt-2 p-2 bg-slate-900 text-green-400 text-xs rounded-lg overflow-auto max-h-64 max-w-sm">
                                {jsonFull}
                              </pre>
                            </details>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Page {page} / {totalPages} —{" "}
                <span className="font-medium">{filteredCount ?? 0}</span> résultats
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <a
                    href={buildUrl({ page: String(page - 1) })}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
                  >
                    ← Précédent
                  </a>
                )}
                {page < totalPages && (
                  <a
                    href={buildUrl({ page: String(page + 1) })}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
                  >
                    Suivant →
                  </a>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
