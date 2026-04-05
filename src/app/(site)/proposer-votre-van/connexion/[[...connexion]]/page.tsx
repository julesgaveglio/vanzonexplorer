"use client";

import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

export default function ConnexionPage() {
  return (
    <section
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4"
      style={{ background: "linear-gradient(160deg, #F1F5F9 0%, #EFF6FF 60%, #F0FDFF 100%)" }}
    >
      <div className="w-full max-w-[420px]">
        {/* En-tête */}
        <div className="text-center mb-7">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/1f483103ef15ee3549eab14ba2801d11b32a9055-313x313.png"
            alt="Vanzon Explorer"
            width={52}
            height={52}
            className="mx-auto mb-4"
            unoptimized
          />
          <h1 className="text-[22px] font-black text-slate-900 leading-tight">
            Bienvenue sur Vanzon Explorer
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">
            Créez votre compte pour déposer votre annonce.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 px-7 py-7">
          <SignUp
            routing="path"
            path="/proposer-votre-van/connexion"
            forceRedirectUrl="/proposer-votre-van/inscription"
            signInForceRedirectUrl="/proposer-votre-van/inscription"
            appearance={{
              layout: {
                socialButtonsVariant: "blockButton",
                socialButtonsPlacement: "top",
              },
              variables: {
                colorBackground: "transparent",
                colorPrimary: "#3B82F6",
                colorText: "#0F172A",
                colorTextSecondary: "#64748B",
                colorInputBackground: "#F8FAFC",
                borderRadius: "0.75rem",
                spacingUnit: "15px",
              },
              elements: {
                rootBox: "w-full",
                card: "shadow-none bg-transparent p-0 w-full gap-4",
                header: "hidden",
                // Boutons sociaux pleine largeur
                socialButtonsBlockButton:
                  "w-full border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-700 font-semibold transition-colors shadow-none",
                socialButtonsBlockButtonText:
                  "font-semibold text-[14px] text-slate-700",
                socialButtonsBlockButtonArrow: "hidden",
                // Divider
                dividerRow: "my-1",
                dividerLine: "bg-slate-200",
                dividerText: "text-slate-400 text-xs font-medium px-2",
                // Inputs
                formFieldInput:
                  "border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white rounded-xl text-slate-900 placeholder:text-slate-400 transition-colors",
                formFieldLabel:
                  "text-slate-600 text-[13px] font-medium",
                formFieldHintText: "text-slate-400 text-xs",
                formFieldErrorText: "text-red-500 text-xs",
                // Bouton principal
                formButtonPrimary:
                  "rounded-xl font-semibold normal-case shadow-none text-sm",
                // Footer — lien "Déjà inscrit ?"
                footer: "hidden",
                footerActionText: "text-slate-500 text-sm",
                footerActionLink:
                  "text-blue-500 hover:text-blue-600 font-semibold text-sm",
              },
            }}
          />
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          En créant un compte, vous acceptez nos{" "}
          <a href="/mentions-legales" className="underline hover:text-slate-600 transition-colors">
            conditions d&apos;utilisation
          </a>
          .
        </p>
      </div>
    </section>
  );
}
