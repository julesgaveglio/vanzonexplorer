"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

// Envoie un page_view à chaque navigation (App Router) sur tout le site public.
// Monté une seule fois dans (site)/layout.tsx.
export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
