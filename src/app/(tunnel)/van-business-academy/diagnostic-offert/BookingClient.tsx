"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CalendlyInline from "@/components/ui/CalendlyInline";
import { getFunnelData } from "@/lib/hooks/useUTMParams";
export default function BookingClient() {
  const router = useRouter();
  const [firstname, setFirstname] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const data = getFunnelData();
    if (data) {
      setFirstname(data.firstname);
      setEmail(data.email);
      fetch("/api/van-business-academy/inscription/step", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, step: "booking" }),
      }).catch(() => {});
    }

    // Listen for Calendly booking completion
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.event === "calendly.event_scheduled") {
        if (data) {
          fetch("/api/van-business-academy/inscription/step", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: data.email, step: "confirmed" }),
          }).catch(() => {});
        }
        router.push("/van-business-academy/appel-confirme");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12">
      {/* Title */}
      <h1
        className="font-display text-2xl sm:text-3xl text-center leading-tight mb-2"
        style={{ color: "#0F172A" }}
      >
        {firstname
          ? `${firstname}, réserve ton appel stratégique gratuit`
          : "Réserve ton appel stratégique gratuit"}
      </h1>

      <p className="text-center text-slate-500 text-sm sm:text-base mb-6 leading-relaxed">
        On regarde ensemble si notre accompagnement est fait pour toi et comment
        on peut t&apos;aider à lancer ton business de van.
      </p>

      {/* Badges */}
      <div className="flex justify-center gap-3 mb-8">
        {["⏱ 30 min", "✓ Gratuit", "✓ Sans engagement"].map((tag) => (
          <span
            key={tag}
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
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

      {/* Calendly inline */}
      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <CalendlyInline
          height={700}
          prefill={firstname ? { name: firstname, email } : undefined}
        />
      </div>

      {/* Reassurance */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-sm text-slate-500">
          Tu parleras directement avec <strong className="text-slate-700">Jules</strong>,
          fondateur de Vanzon Explorer et de la Van Business Academy.
        </p>
        <p className="text-xs text-slate-400">
          Aucun engagement. On discute de ton projet et on voit si on peut t&apos;aider.
        </p>
      </div>
    </div>
  );
}
