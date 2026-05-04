"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { User, ChevronDown, Lock, GraduationCap } from "lucide-react";

const VBA_ICON =
  "https://cdn.sanity.io/images/lewexa74/production/590889d96053ee345a4eaf2fc4909c7064206c94-250x250.webp?auto=format&fit=max&q=82";

interface Formation {
  name: string;
  slug: string;
  emoji: string;
  hasAccess: boolean;
}

interface DashboardNavProps {
  hasVBA: boolean;
  formations: Formation[];
}

export default function DashboardNav({ hasVBA, formations }: DashboardNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close dropdown on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isFormationsActive =
    pathname.startsWith("/dashboard/vba") ||
    pathname.startsWith("/dashboard/formations");

  const navLinkClass = (href: string, exact?: boolean) => {
    const isActive = exact ? pathname === href : pathname.startsWith(href);
    return `flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap active:bg-slate-50 ${
      isActive
        ? "border-slate-900 text-slate-900"
        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
    }`;
  };

  return (
    <nav className="flex gap-0.5 sm:gap-1 -mb-px">
      {/* Mon profil */}
      <Link href="/dashboard" className={navLinkClass("/dashboard", true)}>
        <User className="w-4 h-4" />
        <span className="hidden sm:inline">Mon profil</span>
        <span className="sm:hidden">Profil</span>
      </Link>

      {/* Mes annonces */}
      <Link href="/dashboard/annonces" className={navLinkClass("/dashboard/annonces")}>
        <Image
          src="https://cdn.sanity.io/images/lewexa74/production/1f483103ef15ee3549eab14ba2801d11b32a9055-313x313.png?w=200&h=200&fit=crop&auto=format"
          alt=""
          width={16}
          height={16}
          className="w-4 h-4 rounded-sm object-cover"
          unoptimized
        />
        <span className="hidden sm:inline">Mes annonces</span>
        <span className="sm:hidden">Annonces</span>
      </Link>

      {/* Formations dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap active:bg-slate-50 ${
            isFormationsActive
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <Image
            src={VBA_ICON}
            alt=""
            width={16}
            height={16}
            className="w-4 h-4 rounded-sm object-cover"
            unoptimized
          />
          <span className="hidden sm:inline">Formations</span>
          <span className="sm:hidden">Form.</span>
          <ChevronDown
            className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-1 overflow-hidden">
            {/* VBA */}
            {hasVBA ? (
              <Link
                href="/dashboard/vba"
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <GraduationCap className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-900 flex-1">
                  Van Business Academy
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 cursor-not-allowed opacity-60">
                <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-sm text-slate-400 flex-1">
                  Van Business Academy
                </span>
              </div>
            )}

            {/* Separator */}
            {formations.length > 0 && (
              <div className="border-t border-slate-100 my-1" />
            )}

            {/* Formations dynamiques */}
            {formations.map((f) =>
              f.hasAccess ? (
                <Link
                  key={f.slug}
                  href={`/dashboard/formations/${f.slug}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-base flex-shrink-0">{f.emoji}</span>
                  <span className="text-sm font-medium text-slate-900 flex-1">
                    {f.name}
                  </span>
                </Link>
              ) : (
                <div
                  key={f.slug}
                  className="flex items-center gap-3 px-4 py-3 cursor-not-allowed opacity-60"
                >
                  <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-400 flex-1">
                    {f.name}
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
