"use client";

import { SignUp } from "@clerk/nextjs";

interface FormationSignUpProps {
  formationName: string;
  formationSlug: string;
  description: string;
  emoji: string;
}

export default function FormationSignUp({
  formationName,
  formationSlug,
  description,
  emoji,
}: FormationSignUpProps) {
  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-[#FAF6F0] to-[#F5EDE0]">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <span className="text-4xl block mb-3">{emoji}</span>
          <h1 className="text-2xl font-bold text-slate-900">{formationName}</h1>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            {description}
          </p>
          <p className="text-slate-400 mt-3 text-xs">
            Créez votre compte pour accéder à la formation.
          </p>
        </div>
        <div className="flex justify-center">
          <SignUp
            routing="hash"
            forceRedirectUrl={`/espace-membre/formations/${formationSlug}`}
            appearance={{
              elements: {
                footer: "hidden",
                card: "shadow-none border border-slate-200",
              },
            }}
          />
        </div>
      </div>
    </section>
  );
}
