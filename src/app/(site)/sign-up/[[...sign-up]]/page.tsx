"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <section
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-20 px-4"
      style={{ background: "linear-gradient(160deg, #F3E8FF 0%, #EDE9FE 100%)" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
            Vanzon Explorer
          </span>
          <h1 className="text-3xl font-black text-slate-900">Créer un compte</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Inscrivez-vous pour accéder à votre espace personnel.
          </p>
        </div>
        <div className="flex justify-center">
          <SignUp
            routing="path"
            path="/sign-up"
            appearance={{ elements: { footer: "hidden" } }}
          />
        </div>
      </div>
    </section>
  );
}
