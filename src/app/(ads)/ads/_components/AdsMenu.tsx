"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCampaign } from "./CampaignContext";
import {
  Menu, X,
  LayoutDashboard, MousePointerClick, Users, ClipboardList,
  Play, FileText, Mail, Phone, LogOut,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/ads", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/ads/optin", label: "Opt-in", icon: MousePointerClick },
  { href: "/ads/leads", label: "Leads", icon: Users },
  { href: "/ads/formulaire", label: "Formulaire", icon: ClipboardList },
  { href: "/ads/vsl", label: "VSL", icon: Play, exact: true },
  { href: "/ads/vsl/transcript", label: "Transcript", icon: FileText },
  { href: "/ads/emails", label: "Email", icon: Mail },
  { href: "/ads/calls", label: "Call", icon: Phone },
];

export default function AdsMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const {
    campaigns, activeCampaignId, activeCampaign,
    setActiveCampaignId, loading: campLoading,
  } = useCampaign();

  async function handleLogout() {
    await fetch("/api/ads/auth", { method: "DELETE" });
    window.location.href = "/ads-login";
  }

  // Current page label
  const currentPage = NAV_LINKS.find((l) =>
    l.exact ? pathname === l.href : pathname.startsWith(l.href)
  );

  return (
    <>
      {/* ── Trigger bar ────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Current page indicator (desktop) */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg">
            {activeCampaign ? (
              <>
                <div className={`w-1.5 h-1.5 rounded-full ${activeCampaign.end_date ? "bg-slate-400" : "bg-emerald-500 animate-pulse"}`} />
                <span className="text-xs font-medium text-slate-600 max-w-[160px] truncate">
                  {activeCampaign.name}
                </span>
              </>
            ) : (
              <span className="text-xs font-medium text-slate-600">Toutes les campagnes</span>
            )}
          </div>
          {currentPage && (
            <span className="text-xs text-slate-400">{currentPage.label}</span>
          )}
        </div>

        {/* Burger button */}
        <button
          onClick={() => setOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── Backdrop ───────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-[2px] transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Slide-in panel ─────────────────────────────── */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[80] w-80 sm:w-[340px] bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <p className="text-sm font-semibold text-slate-900">Vanzon Ads</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{email}</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Campaign selector */}
        {!campLoading && campaigns.length > 0 && (
          <div className="px-6 py-4 border-b border-slate-100">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Campagne active
            </label>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeCampaign?.end_date ? "bg-slate-400" : "bg-emerald-500 animate-pulse"}`} />
              <select
                value={activeCampaignId}
                onChange={(e) => setActiveCampaignId(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/30 cursor-pointer"
              >
                <option value="all">Toutes les campagnes</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {!c.end_date ? "(en cours)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-0.5">
            {NAV_LINKS.map((link) => {
              const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-[18px] h-[18px] ${isActive ? "text-white" : "text-slate-400"}`} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Deconnexion
          </button>
        </div>
      </div>
    </>
  );
}
