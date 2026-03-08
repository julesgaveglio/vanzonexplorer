import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion Admin — Vanzon Explorer",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 mb-4">
          <span className="text-white text-xl">🚐</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">Vanzon Admin</h1>
        <p className="text-slate-500 text-sm mt-1">Accès réservé aux administrateurs</p>
      </div>

      {/* Clerk SignIn */}
      <SignIn
        routing="hash"
        redirectUrl="/admin"
        appearance={{
          elements: {
            rootBox: "w-full max-w-sm",
            card: "shadow-sm border border-slate-200 rounded-2xl",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            socialButtonsBlockButton: "border border-slate-200 hover:bg-slate-50",
            formButtonPrimary: "bg-slate-900 hover:bg-slate-800",
            footerActionLink: "text-slate-600 hover:text-slate-900",
          },
        }}
      />
    </div>
  );
}
