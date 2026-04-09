"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import AdminSidebar from "./AdminSidebar";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Persister l'état collapsed dans localStorage
  useEffect(() => {
    const saved = localStorage.getItem("admin-sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("admin-sidebar-collapsed", String(next));
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />

      {/* Zone principale — s'adapte à la largeur de la sidebar */}
      <div
        className={`flex flex-col min-h-screen lg:transition-[padding] lg:duration-300 lg:ease-in-out ${
          collapsed ? 'lg:pl-[60px]' : 'lg:pl-[260px]'
        }`}
      >
        {/* Top bar mobile */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Ouvrir le menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link href="/" className="flex items-center gap-2">
            <Image
              src="https://cdn.sanity.io/images/lewexa74/production/1f483103ef15ee3549eab14ba2801d11b32a9055-313x313.png"
              alt="Vanzon Explorer"
              width={24}
              height={24}
              className="rounded-md"
              unoptimized
            />
            <span className="text-sm font-bold text-slate-800">Vanzon Admin</span>
          </Link>

          <div className="ml-auto">
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
          </div>
        </header>

        {/* Contenu */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
