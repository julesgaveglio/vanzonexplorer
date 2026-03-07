"use client";

import { useState } from "react";
import { scanExternalImages, type IiliImage } from "../actions";

const CATEGORIES = [
  { value: "van-yoni", label: "Van Yoni" },
  { value: "van-xalbat", label: "Van Xalbat" },
  { value: "equipe", label: "Equipe" },
  { value: "pays-basque", label: "Pays Basque" },
  { value: "formation", label: "Formation" },
  { value: "divers", label: "Divers" },
];

type MigrationStatus = "idle" | "migrating" | "done" | "error";

type ImageState = IiliImage & {
  status: MigrationStatus;
  sanityUrl?: string;
  category: string;
  alt: string;
  errorMsg?: string;
};

export default function MigrationTool() {
  const [images, setImages] = useState<ImageState[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  async function scan() {
    setIsScanning(true);
    const found = await scanExternalImages();
    setImages(
      found.map((img) => ({
        ...img,
        status: img.isMigrated ? "done" : "idle",
        category: inferCategory(img.url, img.file),
        alt: inferAlt(img.url, img.file),
      }))
    );
    setIsScanning(false);
    setScanned(true);
  }

  async function migrateOne(url: string) {
    setImages((prev) =>
      prev.map((img) => (img.url === url ? { ...img, status: "migrating" } : img))
    );

    const imgData = images.find((i) => i.url === url);

    try {
      const res = await fetch("/api/admin/migrate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          title: imgData?.alt || "image-vanzon",
          alt: imgData?.alt || "",
          category: imgData?.category || "divers",
        }),
      });

      const data = await res.json();

      if (data.success) {
        setImages((prev) =>
          prev.map((img) =>
            img.url === url
              ? { ...img, status: "done", sanityUrl: data.webpUrl, isMigrated: true }
              : img
          )
        );
      } else {
        setImages((prev) =>
          prev.map((img) =>
            img.url === url ? { ...img, status: "error", errorMsg: data.error } : img
          )
        );
      }
    } catch (err) {
      setImages((prev) =>
        prev.map((img) =>
          img.url === url ? { ...img, status: "error", errorMsg: String(err) } : img
        )
      );
    }
  }

  async function migrateAll() {
    const pending = images.filter((i) => i.status === "idle");
    for (const img of pending) {
      await migrateOne(img.url);
    }
  }

  function updateField(url: string, field: "alt" | "category", value: string) {
    setImages((prev) =>
      prev.map((img) => (img.url === url ? { ...img, [field]: value } : img))
    );
  }

  function copyUrl(url: string, key: string) {
    navigator.clipboard.writeText(url);
    setCopiedUrl(key);
    setTimeout(() => setCopiedUrl(null), 2000);
  }

  const pendingCount = images.filter((i) => i.status === "idle").length;
  const doneCount = images.filter((i) => i.status === "done").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔄</span>
          <div>
            <h3 className="font-bold text-amber-900">Migration intelligente iili.io → Sanity CDN</h3>
            <p className="text-sm text-amber-700 mt-1 leading-relaxed">
              Cet outil scanne tout ton code source, trouve toutes les URLs iili.io/freeimage.host,
              les telecharge, les convertit en WebP et les uploade vers Sanity avec les metadonnees SEO.
              Tu obtiens une URL Sanity optimisee a remplacer dans ton code.
            </p>
          </div>
        </div>
      </div>

      {/* Scan button */}
      {!scanned ? (
        <div className="text-center py-12">
          <button
            onClick={scan}
            disabled={isScanning}
            className="inline-flex items-center gap-3 font-bold text-white px-8 py-4 rounded-2xl transition-all shadow-lg disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)" }}
          >
            {isScanning ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Scan en cours...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Scanner tout le code source
              </>
            )}
          </button>
          <p className="text-xs text-slate-400 mt-3">
            Analyse tous les fichiers .tsx et .ts dans /src/
          </p>
        </div>
      ) : (
        <>
          {/* Stats + actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-black text-slate-900">{images.length}</p>
                <p className="text-xs text-slate-400">URLs trouvees</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-green-600">{doneCount}</p>
                <p className="text-xs text-slate-400">Migrees</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-amber-500">{pendingCount}</p>
                <p className="text-xs text-slate-400">En attente</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={scan}
                className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                Re-scanner
              </button>
              {pendingCount > 0 && (
                <button
                  onClick={migrateAll}
                  className="inline-flex items-center gap-2 font-semibold text-white text-sm px-5 py-2.5 rounded-xl transition-all"
                  style={{ background: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)" }}
                >
                  Migrer tout ({pendingCount} images)
                </button>
              )}
            </div>
          </div>

          {/* Liste images */}
          {images.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <p className="text-4xl mb-3">🎉</p>
              <p className="font-bold text-slate-700">Aucune URL externe trouvee !</p>
              <p className="text-sm text-slate-400 mt-1">Toutes tes images sont deja sur Sanity.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {images.map((img) => (
                <div
                  key={img.url}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                    img.status === "done"
                      ? "border-green-200"
                      : img.status === "error"
                      ? "border-red-200"
                      : img.status === "migrating"
                      ? "border-blue-200"
                      : "border-slate-100"
                  }`}
                >
                  <div className="flex gap-4 p-4">
                    {/* Preview */}
                    <div className="w-20 h-14 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-mono text-slate-500 truncate">{img.url}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            <span className="font-medium text-slate-600">{img.file}</span>
                            {" "}ligne {img.line}
                          </p>
                        </div>
                        {/* Status badge */}
                        <div className="flex-shrink-0">
                          {img.status === "idle" && (
                            <span className="text-xs font-semibold bg-slate-50 text-slate-500 px-2.5 py-1 rounded-lg">A migrer</span>
                          )}
                          {img.status === "migrating" && (
                            <span className="text-xs font-semibold bg-blue-50 text-blue-500 px-2.5 py-1 rounded-lg animate-pulse">Migration...</span>
                          )}
                          {img.status === "done" && (
                            <span className="text-xs font-semibold bg-green-50 text-green-600 px-2.5 py-1 rounded-lg">Migree !</span>
                          )}
                          {img.status === "error" && (
                            <span className="text-xs font-semibold bg-red-50 text-red-500 px-2.5 py-1 rounded-lg">Erreur</span>
                          )}
                        </div>
                      </div>

                      {/* Fields (only when idle or error) */}
                      {(img.status === "idle" || img.status === "error") && (
                        <div className="flex items-center gap-3 mt-3">
                          <input
                            value={img.alt}
                            onChange={(e) => updateField(img.url, "alt", e.target.value)}
                            placeholder="Alt text SEO..."
                            className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
                          />
                          <select
                            value={img.category}
                            onChange={(e) => updateField(img.url, "category", e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => migrateOne(img.url)}
                            className="flex-shrink-0 text-xs font-semibold bg-slate-900 text-white px-4 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                          >
                            Migrer
                          </button>
                        </div>
                      )}

                      {img.status === "error" && img.errorMsg && (
                        <p className="text-xs text-red-500 mt-1">{img.errorMsg}</p>
                      )}

                      {/* Success: show new Sanity URL */}
                      {img.status === "done" && img.sanityUrl && (
                        <div className="flex items-center gap-2 mt-3 bg-green-50 rounded-xl px-3 py-2">
                          <p className="text-xs font-mono text-green-700 truncate flex-1">{img.sanityUrl}</p>
                          <button
                            onClick={() => copyUrl(img.sanityUrl!, img.url)}
                            className="flex-shrink-0 text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            {copiedUrl === img.url ? "Copie !" : "Copier"}
                          </button>
                        </div>
                      )}

                      {img.status === "done" && img.isMigrated && !img.sanityUrl && (
                        <p className="text-xs text-green-600 mt-2 font-medium">
                          Deja migree dans Sanity — voir la mediatheque
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Instructions de remplacement */}
          {doneCount > 0 && (
            <div className="bg-slate-900 rounded-2xl p-6 text-white">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <span>📋</span> Etape suivante : remplacer dans le code
              </h3>
              <p className="text-sm text-white/70 mb-3 leading-relaxed">
                Pour chaque image migree, remplace l&apos;ancienne URL iili.io par la nouvelle URL Sanity dans ton code.
                La nouvelle URL inclut deja la conversion WebP automatique.
              </p>
              <div className="bg-white/10 rounded-xl p-3 font-mono text-xs text-white/80">
                <p className="text-white/40 mb-1">{/* Avant */}</p>
                <p>src=&quot;https://iili.io/xxxxxx.jpg&quot;</p>
                <p className="text-white/40 mt-2 mb-1">{/* Apres */}</p>
                <p>src=&quot;https://cdn.sanity.io/images/...?auto=format&amp;q=82&quot;</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Heuristics to guess category and alt from URL/file path
function inferCategory(url: string, file: string): string {
  const combined = (url + file).toLowerCase();
  if (combined.includes("yoni")) return "van-yoni";
  if (combined.includes("xalbat")) return "van-xalbat";
  if (combined.includes("formation")) return "formation";
  if (combined.includes("pays-basque") || combined.includes("biarritz") || combined.includes("hossegor")) return "pays-basque";
  if (combined.includes("equipe") || combined.includes("jules") || combined.includes("team")) return "equipe";
  return "divers";
}

function inferAlt(url: string, file: string): string {
  // Extract page context from file path
  const fileParts = file.split("/");
  const pageName = fileParts.find((p) => ["location", "formation", "achat", "pays-basque", "club", "road-trip"].includes(p));

  if (pageName === "location") return "Van amenage Vanzon Explorer au Pays Basque";
  if (pageName === "formation") return "Formation vanlife Van Business Academy Vanzon Explorer";
  if (pageName === "achat") return "Achat van amenage Pays Basque avec Vanzon Explorer";
  if (pageName === "pays-basque") return "Paysage Pays Basque en van amenage";
  return "Vanzon Explorer - location van amenage Pays Basque";
}
