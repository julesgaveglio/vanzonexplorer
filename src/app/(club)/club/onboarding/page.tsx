"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Building2, ArrowRight, Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<"choice" | "brand-form">("choice");
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress || "");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState("");

  const handleUserChoice = async () => {
    setLoading(true);
    fetch("/api/club/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "user" }),
    }).catch(() => {});
    router.push("/club/deals");
  };

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetch("/api/club/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "brand", companyName, email, website, message }),
    }).catch(() => {});
    router.push("/club/deals");
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl tracking-display text-earth md:text-5xl">Bienvenue sur Vanzon</h1>
          <p className="mt-3 text-muted">Dis-nous en plus pour personnaliser ton expérience.</p>
        </div>

        {step === "choice" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 sm:grid-cols-2">
            <button onClick={handleUserChoice} disabled={loading} className="group rounded-2xl border border-border bg-white p-8 text-left transition-all hover:border-rust/30 hover:shadow-md">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-cream group-hover:bg-rust/10 transition">
                <User className="h-7 w-7 text-earth group-hover:text-rust transition" />
              </div>
              <h2 className="font-display text-2xl tracking-display text-earth">Je suis un utilisateur</h2>
              <p className="mt-2 text-sm text-muted">Je cherche les meilleurs deals pour aménager mon van.</p>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-rust">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Commencer</span><ArrowRight className="h-4 w-4" /></>}
              </div>
            </button>

            <button onClick={() => setStep("brand-form")} disabled={loading} className="group rounded-2xl border border-border bg-white p-8 text-left transition-all hover:border-rust/30 hover:shadow-md">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-cream group-hover:bg-rust/10 transition">
                <Building2 className="h-7 w-7 text-earth group-hover:text-rust transition" />
              </div>
              <h2 className="font-display text-2xl tracking-display text-earth">Je suis une marque</h2>
              <p className="mt-2 text-sm text-muted">Je souhaite proposer mes offres sur Vanzon Explorer.</p>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-rust">
                <span>Devenir partenaire</span><ArrowRight className="h-4 w-4" />
              </div>
            </button>
          </motion.div>
        )}

        {step === "brand-form" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-2xl border border-border bg-white p-8">
              <h2 className="font-display text-2xl tracking-display text-earth">Demande de partenariat</h2>
              <p className="mt-2 text-sm text-muted">Remplis ce formulaire et notre équipe te recontactera.</p>
              <form onSubmit={handleBrandSubmit} className="mt-8 space-y-4">
                {[
                  { id: "companyName", label: "Nom de l'entreprise", type: "text", value: companyName, set: setCompanyName, placeholder: "Mon entreprise", required: true },
                  { id: "brand-email", label: "Email professionnel", type: "email", value: email, set: setEmail, placeholder: "contact@entreprise.com", required: true },
                  { id: "website", label: "Site web", type: "url", value: website, set: setWebsite, placeholder: "https://www.entreprise.com", required: false },
                ].map((field) => (
                  <div key={field.id}>
                    <label htmlFor={field.id} className="mb-1.5 block text-sm font-medium text-earth">{field.label}</label>
                    <input
                      id={field.id}
                      type={field.type}
                      required={field.required}
                      value={field.value}
                      onChange={(e) => field.set(e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full rounded-xl border border-border bg-cream/50 px-4 py-3 text-earth placeholder:text-muted/50 outline-none transition focus:border-rust focus:ring-2 focus:ring-rust/20"
                    />
                  </div>
                ))}
                <div>
                  <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-earth">Message</label>
                  <textarea id="message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Parlez-nous de vos produits..." className="w-full rounded-xl border border-border bg-cream/50 px-4 py-3 text-earth placeholder:text-muted/50 outline-none transition focus:border-rust focus:ring-2 focus:ring-rust/20 resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep("choice")} className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-muted transition-colors hover:bg-cream">Retour</button>
                  <button type="submit" disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rust px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-rust-dark disabled:opacity-50">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Envoyer ma demande"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
