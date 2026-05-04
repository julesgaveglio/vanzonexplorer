"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Mon profil",
    shortLabel: "Profil",
    href: "/dashboard",
    icon: "user" as const,
    exact: true,
  },
  {
    label: "Mes annonces",
    shortLabel: "Annonces",
    href: "/dashboard/annonces",
    icon: "https://cdn.sanity.io/images/lewexa74/production/1f483103ef15ee3549eab14ba2801d11b32a9055-313x313.png?w=200&h=200&fit=crop&auto=format" as const,
  },
  {
    label: "Van Business Academy",
    shortLabel: "VBA",
    href: "/dashboard/vba",
    icon: "https://cdn.sanity.io/images/lewexa74/production/590889d96053ee345a4eaf2fc4909c7064206c94-250x250.webp?auto=format&fit=max&q=82" as const,
  },
  {
    label: "Homologation VASP",
    shortLabel: "VASP",
    href: "/dashboard/formations/homologation-vasp",
    icon: "gold" as const,
  },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-0.5 sm:gap-1 -mb-px overflow-x-auto scrollbar-hide">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap active:bg-slate-50 ${
              isActive
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {item.icon === "user" ? (
              <User className="w-4 h-4" />
            ) : item.icon === "gold" ? (
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                <rect width="16" height="16" rx="3" fill="url(#goldNav)" />
                <path d="M8 4l1.5 3H12l-2.5 2 1 3L8 10.5 5.5 12l1-3L4 7h2.5L8 4z" fill="white" />
                <defs>
                  <linearGradient id="goldNav" x1="0" y1="0" x2="16" y2="16">
                    <stop stopColor="#B9945F" />
                    <stop offset="1" stopColor="#E4D398" />
                  </linearGradient>
                </defs>
              </svg>
            ) : (
              <Image
                src={item.icon}
                alt=""
                width={16}
                height={16}
                className="w-4 h-4 rounded-sm object-cover"
                unoptimized
              />
            )}
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sm:hidden">{item.shortLabel ?? item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
