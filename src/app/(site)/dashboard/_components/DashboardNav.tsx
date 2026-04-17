"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Truck, Play } from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Mon profil",
    href: "/dashboard",
    icon: User,
    exact: true,
  },
  {
    label: "Mes annonces",
    href: "/dashboard/annonces",
    icon: Truck,
  },
  {
    label: "Van Business Academy",
    href: "/dashboard/vba",
    icon: Play,
  },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 -mb-px overflow-x-auto">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              isActive
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
