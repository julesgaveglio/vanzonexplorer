"use client";

import { useSearchParams } from "next/navigation";

export default function AdLandingGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const isAd =
    searchParams.get("from") === "ad" ||
    !!searchParams.get("utm_source") ||
    searchParams.get("utm_medium") === "paid";

  if (isAd) return null;
  return <>{children}</>;
}
