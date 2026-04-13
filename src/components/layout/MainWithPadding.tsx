"use client";

import { useSearchParams } from "next/navigation";

export default function MainWithPadding({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const isAd =
    searchParams.get("from") === "ad" ||
    !!searchParams.get("utm_source") ||
    searchParams.get("utm_medium") === "paid";

  return (
    <main className={`min-h-screen${isAd ? "" : " pt-16"}`}>{children}</main>
  );
}
