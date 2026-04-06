import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ArrowRight, MapPin } from "lucide-react";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mon espace — Vanzon Explorer",
  robots: { index: false, follow: false },
};

async function ensureProfile(clerkId: string, email: string, name: string, avatar: string) {
  const supabase = createSupabaseAdmin();
  await supabase.from("profiles").upsert(
    { clerk_id: clerkId, email, full_name: name, avatar_url: avatar },
    { onConflict: "clerk_id", ignoreDuplicates: false }
  );
}

async function getMyListing(email: string) {
  if (!email) return null;
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("marketplace_vans")
    .select("id, title, status, price_per_day, location_city, photos, created_at, admin_notes, booking_url, van_brand, van_model")
    .eq("owner_email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

/* ─── Status config ─────────────────────────────────────────────────────── */

const STATUS_CONFIG = {
  pending: {
    emoji: "⏳",
    title: "Annonce en cours de vérification",
    desc: "Notre équipe vérifie votre fiche. Vous serez contacté par email sous 24 à 72h.",
    cardBg: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    label: "En attente",
  },
  approved: {
    emoji: "✅",
    title: "Votre annonce est en ligne !",
    desc: "Votre van est visible sur Vanzon Explorer. Les visiteurs peuvent vous contacter via votre lien de réservation.",
    cardBg: "bg-emerald-50 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    label: "En ligne",
  },
  rejected: {
    emoji: "❌",
    title: "Annonce non acceptée",
    desc: "Votre annonce n'a pas été publiée. Vous pouvez en soumettre une nouvelle.",
    cardBg: "bg-red-50 border-red-200",
    badge: "bg-red-100 text-red-700",
    label: "Refusée",
  },
};

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function NoListing({ firstName }: { firstName: string }) {
  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 text-center">
        <div className="text-5xl mb-5">🚐</div>
        <h2 className="text-xl font-black text-slate-900 mb-2">
          {firstName ? `${firstName}, votre` : "Votre"} van n&apos;est pas encore en ligne.
        </h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          Déposez votre fiche en 2 minutes. Votre van obtient sa propre page référencée sur Google,
          sans commission et sans exclusivité.
        </p>
        <Link
          href="/proprietaire/inscription"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-sky-400 text-white font-semibold px-7 py-3.5 rounded-full hover:from-blue-600 hover:to-sky-500 transition-all shadow-lg shadow-blue-500/20"
        >
          Déposer mon annonce <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <p className="text-center text-xs text-slate-400">
        Vous avez des questions ?{" "}
        <Link href="/proprietaire" className="text-blue-500 hover:underline">
          En savoir plus
        </Link>
      </p>
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ListingCard({ listing }: { listing: any }) {
  const status = listing.status as keyof typeof STATUS_CONFIG;
  const conf = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const coverPhoto: string | undefined = listing.photos?.[0];

  return (
    <>
      {/* Status banner */}
      <div className={`rounded-2xl border p-5 ${conf.cardBg}`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none mt-0.5">{conf.emoji}</span>
          <div>
            <p className="font-bold text-slate-900 text-sm mb-0.5">{conf.title}</p>
            <p className="text-slate-600 text-xs leading-relaxed">
              {status === "rejected" && listing.admin_notes
                ? listing.admin_notes
                : conf.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Listing preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {coverPhoto && (
          <div className="relative h-44 w-full bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverPhoto} alt={listing.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-snug">{listing.title}</h3>
              {listing.van_brand && (
                <p className="text-xs text-slate-400 mt-0.5">{listing.van_brand} {listing.van_model}</p>
              )}
            </div>
            <span className={`flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${conf.badge}`}>
              {conf.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            {listing.location_city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {listing.location_city}
              </span>
            )}
            {listing.price_per_day && (
              <span className="font-semibold text-slate-700">
                {listing.price_per_day}€<span className="font-normal text-slate-400">/jour</span>
              </span>
            )}
          </div>

          {listing.booking_url && status === "approved" && (
            <a
              href={listing.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              Voir mon lien de réservation <ArrowRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Resubmit CTA if rejected */}
      {status === "rejected" && (
        <Link
          href="/proprietaire/inscription"
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-sky-400 text-white font-semibold px-7 py-3.5 rounded-full hover:from-blue-600 hover:to-sky-500 transition-all shadow-lg shadow-blue-500/20"
        >
          Soumettre une nouvelle annonce <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const firstName = user?.firstName ?? "";
  const fullName  = `${firstName} ${user?.lastName ?? ""}`.trim() || "Propriétaire";
  const email     = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const avatar    = user?.imageUrl ?? "";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const [listing] = await Promise.all([
    getMyListing(email),
    ensureProfile(userId, email, fullName, avatar),
  ]);

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #F8FAFC 0%, #EFF6FF 100%)" }}
    >
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden ring-2 ring-slate-100 flex-shrink-0">
              {avatar ? (
                <Image src={avatar} alt={fullName} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-sky-400 flex items-center justify-center text-white font-bold text-sm">
                  {fullName[0]}
                </div>
              )}
            </div>
            <div>
              <p className="text-[11px] text-slate-400 leading-none mb-0.5">{greeting}</p>
              <p className="text-sm font-bold text-slate-900 leading-none">{firstName || fullName}</p>
            </div>
          </div>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonPopoverFooter: "hidden",
              },
            }}
          />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-6 py-10 space-y-5">
        {listing ? (
          <ListingCard listing={listing} />
        ) : (
          <NoListing firstName={firstName} />
        )}
      </main>
    </div>
  );
}
