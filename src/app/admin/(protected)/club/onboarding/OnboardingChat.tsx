"use client";

import { useState, useRef, useEffect } from "react";

// ── TYPES ──────────────────────────────────────────────────────────────────────

interface LogEntry {
  id: number;
  level: "info" | "success" | "warning" | "error" | "scraping" | "product";
  message: string;
}

interface BrandInfo {
  name: string;
  website: string;
  description: string;
  logoUrl: string | null;
  promoCode: string | null;
}

interface ProductInfo {
  name: string;
  description: string;
  imageUrl: string | null;
  category: string;
  originalPrice: number | null;
  promoPrice: number | null;
}

interface DoneInfo {
  brandName: string;
  brandId: string;
  productsCreated: number;
  categoriesCreated: number;
  logoUrl: string | null;
}

type SSEEvent =
  | { type: "log"; level: string; message: string }
  | { type: "brand"; name: string; website: string; description: string; logoUrl: string | null; promoCode: string | null }
  | { type: "product"; name: string; description: string; imageUrl: string | null; category: string; originalPrice: number | null; promoPrice: number | null }
  | { type: "done"; brandName: string; brandId: string; productsCreated: number; categoriesCreated: number; logoUrl: string | null }
  | { type: "error"; message: string };

// ── LOG STYLES ─────────────────────────────────────────────────────────────────

function getLogStyle(level: string): { color: string; prefix: string } {
  switch (level) {
    case "success":
      return { color: "#4ade80", prefix: "" };
    case "warning":
      return { color: "#fbbf24", prefix: "" };
    case "error":
      return { color: "#f87171", prefix: "" };
    case "scraping":
      return { color: "#60a5fa", prefix: "" };
    case "product":
      return { color: "#a78bfa", prefix: "" };
    default:
      return { color: "#94a3b8", prefix: "" };
  }
}

// ── COMPONENT ──────────────────────────────────────────────────────────────────

export default function OnboardingChat() {
  const [emailText, setEmailText] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [brand, setBrand] = useState<BrandInfo | null>(null);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [done, setDone] = useState<DoneInfo | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const logIdRef = useRef(0);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  function addLog(level: LogEntry["level"], message: string) {
    setLogs((prev) => [
      ...prev,
      { id: logIdRef.current++, level, message },
    ]);
  }

  async function handleLaunch() {
    if (!emailText.trim() || running) return;

    setLogs([]);
    setBrand(null);
    setProducts([]);
    setDone(null);
    setError(null);
    setRunning(true);
    logIdRef.current = 0;

    try {
      const res = await fetch("/api/admin/club/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText }),
      });

      if (!res.ok || !res.body) {
        setError(`Erreur HTTP ${res.status}`);
        setRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done: readerDone, value } = await reader.read();
        if (readerDone) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          let event: SSEEvent;
          try {
            event = JSON.parse(jsonStr) as SSEEvent;
          } catch {
            continue;
          }

          if (event.type === "log") {
            const level = event.level as LogEntry["level"];
            addLog(level, event.message);
          } else if (event.type === "brand") {
            setBrand({
              name: event.name,
              website: event.website,
              description: event.description,
              logoUrl: event.logoUrl,
              promoCode: event.promoCode,
            });
          } else if (event.type === "product") {
            setProducts((prev) => [
              ...prev,
              {
                name: event.name,
                description: event.description,
                imageUrl: event.imageUrl,
                category: event.category,
                originalPrice: event.originalPrice,
                promoPrice: event.promoPrice,
              },
            ]);
          } else if (event.type === "done") {
            setDone({
              brandName: event.brandName,
              brandId: event.brandId,
              productsCreated: event.productsCreated,
              categoriesCreated: event.categoriesCreated,
              logoUrl: event.logoUrl,
            });
          } else if (event.type === "error") {
            setError(event.message);
            addLog("error", `❌ ${event.message}`);
          }
        }
      }
    } catch (e) {
      setError(String(e));
      addLog("error", `❌ Erreur réseau : ${String(e)}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0B1120", color: "#e2e8f0" }}
    >
      {/* Header */}
      <div
        className="px-8 py-5 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3">
          {/* Robot icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}
          >
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-bold text-xl tracking-tight">
              Agent Onboarding Marque
            </h1>
            <p className="text-white/40 text-sm mt-0.5">
              Colle un email partenaire · l&apos;agent scrappe, analyse et crée tout automatiquement
            </p>
          </div>
          {running && (
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-sm font-medium">Agent en cours...</span>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — terminal logs (60%) */}
        <div
          className="w-[60%] flex flex-col border-r"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          {/* Terminal */}
          <div
            className="flex-1 overflow-y-auto p-4 font-mono text-sm"
            style={{ minHeight: 0 }}
          >
            {logs.length === 0 && !running && (
              <div className="flex flex-col items-center justify-center h-full text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
                <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Le terminal s&apos;affichera ici</p>
                <p className="text-xs mt-1 opacity-60">Colle un email et lance l&apos;agent</p>
              </div>
            )}

            {logs.map((log) => {
              const { color, prefix } = getLogStyle(log.level);
              return (
                <div key={log.id} className="flex gap-2 mb-1 leading-relaxed">
                  <span style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>
                    {String(log.id).padStart(3, "0")}
                  </span>
                  <span style={{ color }}>
                    {prefix}
                    {log.message}
                  </span>
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>

          {/* Input area */}
          <div
            className="p-4 border-t"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              disabled={running}
              rows={6}
              placeholder="Colle ici l'échange email avec la marque partenaire..."
              className="w-full resize-none rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e2e8f0",
              }}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-white/30 text-xs">
                {emailText.length > 0 ? `${emailText.length} caractères` : "En attente d'un email..."}
              </span>
              <button
                onClick={handleLaunch}
                disabled={running || !emailText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: running
                    ? "rgba(99,102,241,0.3)"
                    : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "white",
                  boxShadow: running ? "none" : "0 4px 15px rgba(99,102,241,0.4)",
                }}
              >
                {running ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    En cours...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Lancer l&apos;agent
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right panel — brand + products (40%) */}
        <div className="w-[40%] overflow-y-auto p-4 space-y-4">
          {/* Empty state */}
          {!brand && !done && (
            <div className="flex flex-col items-center justify-center h-full text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
              <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-sm">Les infos de la marque</p>
              <p className="text-xs mt-1 opacity-60">et les produits apparaîtront ici</p>
            </div>
          )}

          {/* Done summary */}
          {done && (
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-green-400 text-xl">🎉</span>
                <span className="text-green-400 font-bold text-base">Onboarding terminé !</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <p style={{ color: "#94a3b8" }}>
                  <span className="text-green-400">✅</span> Marque{" "}
                  <span className="text-white font-medium">{done.brandName}</span> créée
                </p>
                <p style={{ color: "#94a3b8" }}>
                  <span className="text-green-400">✅</span>{" "}
                  <span className="text-white font-medium">{done.productsCreated}</span> produits ajoutés
                </p>
                <p style={{ color: "#94a3b8" }}>
                  <span className="text-green-400">✅</span>{" "}
                  <span className="text-white font-medium">{done.categoriesCreated}</span> catégories traitées
                </p>
              </div>
              <a
                href="/admin/club"
                className="mt-3 flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Voir dans Club Privé
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}
            >
              <p className="text-red-400 text-sm font-medium">❌ Erreur</p>
              <p className="text-red-300/70 text-xs mt-1">{error}</p>
            </div>
          )}

          {/* Brand card */}
          {brand && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div
                className="px-4 py-3 flex items-center gap-2 border-b"
                style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(99,102,241,0.1)" }}
              >
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                  Marque détectée
                </span>
              </div>
              <div className="p-4 flex gap-3">
                {brand.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="w-14 h-14 object-contain rounded-lg flex-shrink-0"
                    style={{ background: "white", padding: "6px" }}
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center text-white/20 text-xl font-bold"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    {brand.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-bold text-base truncate">{brand.name}</h3>
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 text-xs hover:underline truncate block"
                  >
                    {brand.website}
                  </a>
                  {brand.promoCode && (
                    <span
                      className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded text-xs font-mono font-bold"
                      style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}
                    >
                      {brand.promoCode}
                    </span>
                  )}
                  <p className="text-white/50 text-xs mt-1.5 line-clamp-2">{brand.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Products */}
          {products.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="text-violet-400 text-xs font-semibold uppercase tracking-wider">
                  Produits ({products.length})
                </span>
              </div>
              <div className="space-y-2">
                {products.map((product, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-3 flex gap-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center text-white/20"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white text-sm font-medium leading-tight line-clamp-1">
                          {product.name}
                        </p>
                        <span
                          className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}
                        >
                          {product.category}
                        </span>
                      </div>
                      <p className="text-white/40 text-xs mt-0.5 line-clamp-2">{product.description}</p>
                      {(product.originalPrice || product.promoPrice) && (
                        <div className="flex items-center gap-2 mt-1">
                          {product.promoPrice && (
                            <span className="text-green-400 text-xs font-bold">
                              {product.promoPrice}€
                            </span>
                          )}
                          {product.originalPrice && product.originalPrice !== product.promoPrice && (
                            <span className="text-white/30 text-xs line-through">
                              {product.originalPrice}€
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
