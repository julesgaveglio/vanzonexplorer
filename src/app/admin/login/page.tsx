"use client";

import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 mb-4 shadow-lg">
            <span className="text-white text-2xl">🚐</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Vanzon Admin</h1>
          <p className="text-slate-500 text-sm mt-1">Espace réservé aux administrateurs</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Connexion requise</h2>
          <p className="text-slate-500 text-sm mb-6">
            Connectez-vous avec votre compte admin pour accéder au dashboard.
          </p>

          <Link
            href="/sign-in?redirect_url=/admin"
            className="flex items-center justify-center w-full px-4 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors text-sm"
          >
            Se connecter
          </Link>
        </div>

        {/* Back */}
        <p className="text-center mt-6">
          <Link href="/" className="text-slate-400 text-xs hover:text-slate-600 transition-colors">
            ← Retour au site
          </Link>
        </p>
      </div>
    </div>
  );
}
