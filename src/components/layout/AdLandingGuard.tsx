"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Lit les params d'URL après montage, re-évalués à chaque navigation interne
// via usePathname (jamais useSearchParams ici : appelé depuis le layout
// (site), il basculerait tout le HTML statique en rendu client et servirait
// des pages vides à Googlebot — usePathname n'a pas cet effet).
export default function AdLandingGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isAd, setIsAd] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setIsAd(
      p.get("from") === "ad" ||
        !!p.get("utm_source") ||
        p.get("utm_medium") === "paid"
    );
  }, [pathname]);

  if (isAd) return null;
  return <>{children}</>;
}
