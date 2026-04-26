"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Mon profil",
    href: "/dashboard",
    icon: "user" as const,
    exact: true,
  },
  {
    label: "Mes annonces",
    href: "/dashboard/annonces",
    icon: "https://cdn.sanity.io/images/lewexa74/production/1f483103ef15ee3549eab14ba2801d11b32a9055-313x313.png?w=200&h=200&fit=crop&auto=format" as const,
  },
  {
    label: "Van Business Academy",
    href: "/dashboard/vba",
    icon: "https://cdn.sanity.io/images/lewexa74/production/590889d96053ee345a4eaf2fc4909c7064206c94-250x250.webp?auto=format&fit=max&q=82" as const,
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
            {item.icon === "user" ? (
              <User className="w-4 h-4" />
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
