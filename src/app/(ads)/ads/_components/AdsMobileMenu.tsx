"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, Users, Play, LogOut } from "lucide-react";

const LINKS = [
  { href: "/ads", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/ads/leads", label: "Leads", icon: Users },
  { href: "/ads/vsl", label: "VSL", icon: Play },
];

export default function AdsMobileMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/ads/auth", { method: "DELETE" });
    window.location.href = "/ads-login";
  }

  return (
    <div className="sm:hidden">
      {/* Burger button */}
      <button
        onClick={() => setOpen(true)}
        className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-in panel from right */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[70] w-72 bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <span className="text-sm font-semibold text-slate-900">Menu</span>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 active:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <div className="px-3 py-4 space-y-1">
          {LINKS.map((link) => {
            const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 px-5 py-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 mb-3 truncate">{email}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}
