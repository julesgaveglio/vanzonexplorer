"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CalendlyInline from "@/components/ui/CalendlyInline";

export default function SigmaBookingClient() {
  const router = useRouter();
  const [firstname, setFirstname] = useState("");
  const [email, setEmail] = useState("");
  const bookedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sigma_funnel");
      if (raw) {
        const data = JSON.parse(raw);
        if (data.firstname) setFirstname(data.firstname);
        if (data.email) setEmail(data.email);
      }
    } catch {}

    // Listen for Calendly booking completion
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.event === "calendly.event_scheduled" && !bookedRef.current) {
        bookedRef.current = true;
        router.push("/sigmafactory/appel-confirme");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12">
      {/* Logo */}
      <div className="flex justify-center mt-8 mb-6">
        <Image
          src="/images/sigma-factory-logo.png"
          alt="Sigma Factory"
          width={160}
          height={48}
          unoptimized
        />
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-center leading-tight mb-2" style={{ color: "#0F172A" }}>
        {firstname
          ? `${firstname}, reserve ton appel strategique`
          : "Reserve ton appel strategique"}
      </h1>

      <p className="text-center text-slate-500 text-sm sm:text-base mb-6 leading-relaxed">
        On regarde ensemble ta situation et comment la strategie IDRH
        peut t&apos;aider a construire ton patrimoine immobilier.
      </p>

      {/* Badges */}
      <div className="flex justify-center gap-3 mb-8">
        {["30 min", "Gratuit", "Sans engagement"].map((tag) => (
          <span
            key={tag}
            className="text-xs font-medium px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(185,148,95,0.08)",
              color: "#B9945F",
              border: "1px solid rgba(185,148,95,0.15)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Calendly inline — replace URL with real Calendly link */}
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <CalendlyInline
          height={700}
          prefill={firstname ? { name: firstname, email } : undefined}
        />
      </div>

      {/* Reassurance */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-sm text-slate-500">
          Tu parleras directement avec un expert de l&apos;equipe{" "}
          <strong className="text-slate-700">Sigma Factory</strong>.
        </p>
        <p className="text-xs text-slate-400">
          Aucun engagement. On discute de ton projet et on voit si on peut t&apos;aider.
        </p>
      </div>
    </div>
  );
}
