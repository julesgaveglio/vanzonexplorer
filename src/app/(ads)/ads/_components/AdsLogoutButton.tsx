"use client";

import { useRouter } from "next/navigation";

export default function AdsLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/ads/auth", { method: "DELETE" });
    router.push("/ads-login");
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
    >
      Déconnexion
    </button>
  );
}
