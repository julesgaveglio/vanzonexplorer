"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/ads", label: "Dashboard", exact: true },
  { href: "/ads/leads", label: "Leads" },
  { href: "/ads/vsl", label: "VSL" },
];

export default function AdsNavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      {LINKS.map((link) => {
        const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
              isActive
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
