"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ProfileTab from "./ProfileTab";

type Van = {
  id: string;
  slug: string;
  name: string;
  model: string;
  price_per_night: number;
  main_image_url: string | null;
  yescapa_url: string | null;
  features: string[];
  seats: number;
  sleeping_spots: number;
};

type SavedDeal = {
  id: string;
  product_id: string;
  created_at: string;
  products: {
    id: string;
    slug: string;
    name: string;
    promo_price: number;
    original_price: number;
    discount_percent: number | null;
    promo_code: string | null;
    main_image_url: string | null;
    offer_type: string | null;
    brands: { name: string; logo_url: string | null } | null;
  } | null;
};

type Profile = {
  id: string;
  clerk_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  van_model: string | null;
  van_year: number | null;
  plan: string;
} | null;

interface Props {
  profile: Profile;
  savedDeals: SavedDeal[];
  vans: Van[];
  clerkId: string;
  userEmail: string;
  userName: string;
}

const tabs = [
  { id: "profil", label: "Profil", icon: "👤" },
  { id: "club", label: "Club privé", icon: "💳" },
  { id: "location", label: "Mes locations", icon: "🚐" },
];

export default function DashboardTabs({ profile, savedDeals, vans, clerkId, userEmail, userName }: Props) {
  const [active, setActive] = useState("profil");
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div>
      {/* Tabs nav */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-slate-100 shadow-sm mb-8 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              active === tab.id
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB PROFIL ── */}
      {active === "profil" && (
        <ProfileTab
          profile={profile}
          clerkId={clerkId}
          userEmail={userEmail}
          userName={userName}
        />
      )}

      {/* ── TAB CLUB ── */}
      {active === "club" && (
        <div className="space-y-6">
          {/* Statut abonnement */}
          <div className={`rounded-2xl p-6 border ${
            profile?.plan === "club_member"
              ? "bg-purple-50 border-purple-100"
              : "bg-white border-slate-100"
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {profile?.plan === "club_member" ? "Club Privé — Actif" : "Compte gratuit"}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {profile?.plan === "club_member"
                    ? "Accès complet à tous les deals partenaires et codes promo exclusifs."
                    : "Passez au Club Privé pour débloquer les codes promo et réductions exclusives."}
                </p>
              </div>
              {profile?.plan !== "club_member" && (
                <Link
                  href="/club"
                  className="inline-flex items-center gap-2 bg-purple-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-purple-700 transition-colors"
                >
                  Rejoindre le Club →
                </Link>
              )}
            </div>
          </div>

          {/* Deals sauvegardés */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Deals sauvegardés
              <span className="ml-2 text-sm font-normal text-slate-400">({savedDeals.length})</span>
            </h3>

            {savedDeals.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <div className="text-4xl mb-3">🔖</div>
                <p className="text-slate-500 text-sm">Aucun deal sauvegardé pour l&apos;instant.</p>
                <Link
                  href="/club"
                  className="inline-block mt-4 text-sm font-semibold text-accent-blue hover:underline"
                >
                  Découvrir les deals →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedDeals.map((deal) => {
                  const p = deal.products;
                  if (!p) return null;
                  return (
                    <div
                      key={deal.id}
                      className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {p.main_image_url && (
                        <div className="relative aspect-video">
                          <Image
                            src={p.main_image_url}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                          {p.discount_percent && (
                            <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              -{p.discount_percent}%
                            </span>
                          )}
                        </div>
                      )}
                      <div className="p-4">
                        {p.brands && (
                          <p className="text-xs text-slate-400 font-medium mb-1">{p.brands.name}</p>
                        )}
                        <h4 className="text-sm font-semibold text-slate-900 mb-2 line-clamp-2">{p.name}</h4>
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-base font-bold text-slate-900">
                            {p.promo_price.toFixed(2)} €
                          </span>
                          {p.original_price > p.promo_price && (
                            <span className="text-sm text-slate-400 line-through">
                              {p.original_price.toFixed(2)} €
                            </span>
                          )}
                        </div>
                        {p.promo_code && (
                          <button
                            onClick={() => copyCode(p.promo_code!)}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs font-mono font-semibold transition-colors ${
                              copied === p.promo_code
                                ? "bg-green-50 border-green-200 text-green-700"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <span>{copied === p.promo_code ? "Copié !" : p.promo_code}</span>
                            {copied !== p.promo_code && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 flex-shrink-0">
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB LOCATION ── */}
      {active === "location" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Nos vans disponibles</h2>
            <p className="text-sm text-slate-500">
              Réservez directement via Yescapa — plateforme sécurisée avec assurance incluse.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vans.map((van) => (
              <div key={van.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                {van.main_image_url && (
                  <div className="relative aspect-[16/9]">
                    <Image
                      src={van.main_image_url}
                      alt={`Van ${van.name}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{van.name}</h3>
                      <p className="text-sm text-slate-400">{van.model}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">{van.price_per_night} €</p>
                      <p className="text-xs text-slate-400">/ nuit</p>
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="flex gap-4 text-sm text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      {van.seats} places
                    </span>
                    <span className="flex items-center gap-1">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                        <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/>
                        <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/>
                        <path d="M12 4v6"/><path d="M2 18h20"/>
                      </svg>
                      {van.sleeping_spots} couchages
                    </span>
                  </div>

                  {/* Features */}
                  {van.features && van.features.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {van.features.slice(0, 3).map((f) => (
                        <span key={f} className="text-xs bg-slate-50 text-slate-600 px-2.5 py-1 rounded-full border border-slate-100">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}

                  {van.yescapa_url ? (
                    <a
                      href={van.yescapa_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-sm w-full text-center block"
                    >
                      Réserver sur Yescapa →
                    </a>
                  ) : (
                    <Link href="/location" className="btn-ghost text-sm w-full text-center block">
                      Voir les détails
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {vans.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <div className="text-4xl mb-3">🚐</div>
              <p className="text-slate-500 text-sm">Aucun van disponible pour le moment.</p>
              <Link href="/location" className="inline-block mt-4 text-sm font-semibold text-accent-blue hover:underline">
                Voir la page location →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
