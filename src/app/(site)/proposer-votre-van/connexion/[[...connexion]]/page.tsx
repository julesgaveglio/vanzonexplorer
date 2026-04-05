"use client";

import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

export default function ConnexionPage() {
  return (
    <section className="min-h-screen flex items-center justify-center py-12 px-4 bg-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/1f483103ef15ee3549eab14ba2801d11b32a9055-313x313.png"
            alt="Vanzon Explorer"
            width={56}
            height={56}
            className="mx-auto mb-5 rounded-xl"
            unoptimized
          />
          <h1 className="text-2xl font-black text-slate-900">
            Bienvenue sur Vanzon Explorer
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Créez votre compte pour déposer votre annonce de location.
          </p>
        </div>

        <div className="flex justify-center">
          <SignUp
            routing="path"
            path="/proposer-votre-van/connexion"
            forceRedirectUrl="/proposer-votre-van/inscription"
            signInForceRedirectUrl="/proposer-votre-van/inscription"
            appearance={{
              variables: {
                colorPrimary: "#3B82F6",
                borderRadius: "0.75rem",
              },
              elements: {
                rootBox: "w-full",
                card: "shadow-none bg-transparent p-0 w-full",
                header: "hidden",
                socialButtonsBlockButton:
                  "bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium hover:bg-slate-100 transition-colors",
                socialButtonsBlockButtonText: "font-medium text-slate-700",
                dividerLine: "bg-slate-200",
                dividerText: "text-slate-400 text-sm",
                formButtonPrimary:
                  "bg-gradient-to-r from-blue-500 to-sky-400 hover:from-blue-600 hover:to-sky-500 rounded-xl font-semibold shadow-none normal-case",
                formFieldInput:
                  "rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-400/50",
                footerActionText: "text-slate-500",
                footerActionLink: "text-blue-500 hover:text-blue-600 font-semibold",
                footer: "hidden",
              },
            }}
          />
        </div>
      </div>
    </section>
  );
}
