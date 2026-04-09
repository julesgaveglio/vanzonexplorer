import { adminReadClient } from "@/lib/sanity/adminClient";
import { groq } from "next-sanity";
import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/ui";

const settingsQuery = groq`
  *[_type == "siteSettings"][0] {
    "openGraphImageUrl": openGraphImage.asset->url,
    "openGraphImageAlt": openGraphImage.alt,
    twitterHandle
  }
`;

export default async function AdminSettingsPage() {
  const settings = await adminReadClient.fetch<{
    openGraphImageUrl?: string;
    openGraphImageAlt?: string;
    twitterHandle?: string;
  }>(settingsQuery);

  const sections = [
    {
      title: "Image Open Graph",
      desc: "Image affichee lors des partages sur les reseaux sociaux (1200x630px).",
      status: settings?.openGraphImageUrl ? "configured" : "missing",
      statusLabel: settings?.openGraphImageUrl ? "Configuree" : "Manquante",
      action: { label: "Modifier dans Sanity Studio", href: "/studio/structure/siteSettings" },
      preview: settings?.openGraphImageUrl,
    },
    {
      title: "Twitter / X Handle",
      desc: "Compte Twitter pour les meta-tags de partage.",
      status: settings?.twitterHandle ? "configured" : "optional",
      statusLabel: settings?.twitterHandle ? settings.twitterHandle : "Non configure",
      action: { label: "Modifier dans Sanity Studio", href: "/studio/structure/siteSettings" },
    },
  ];

  const envChecks = [
    { label: "NEXT_PUBLIC_SANITY_PROJECT_ID", value: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, required: true },
    { label: "NEXT_PUBLIC_SANITY_DATASET", value: process.env.NEXT_PUBLIC_SANITY_DATASET, required: true },
    { label: "SANITY_API_READ_TOKEN", value: process.env.SANITY_API_READ_TOKEN ? "***configure***" : undefined, required: true },
    { label: "SANITY_API_WRITE_TOKEN", value: process.env.SANITY_API_WRITE_TOKEN ? "***configure***" : undefined, required: false },
    { label: "NEXT_PUBLIC_GA_MEASUREMENT_ID", value: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, required: false },
    { label: "NEXT_PUBLIC_SITE_URL", value: process.env.NEXT_PUBLIC_SITE_URL, required: true },
    { label: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", value: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "***configure***" : undefined, required: true },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Parametres"
        subtitle="Configuration du site et variables d'environnement."
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Contenu Sanity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50">
            <h2 className="font-bold text-slate-900">Contenu Sanity</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {sections.map((s) => (
              <div key={s.title} className="px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-800 text-sm">{s.title}</p>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                          s.status === "configured"
                            ? "bg-green-50 text-green-600"
                            : s.status === "missing"
                            ? "bg-red-50 text-red-500"
                            : "bg-slate-50 text-slate-400"
                        }`}
                      >
                        {s.statusLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                    {s.preview && (
                      <div className="mt-3 rounded-xl overflow-hidden w-full aspect-[1200/630] max-w-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`${s.preview}?w=400&h=210&fit=crop&auto=format`}
                          alt="OG Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <a
                    href={s.action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors underline underline-offset-2"
                  >
                    {s.action.label}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Variables d'env */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50">
            <h2 className="font-bold text-slate-900">Variables d&apos;environnement</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {envChecks.map((env) => (
              <div key={env.label} className="px-6 py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      env.value ? "bg-green-400" : env.required ? "bg-red-400" : "bg-slate-300"
                    }`}
                  />
                  <code className="text-xs text-slate-600 font-mono truncate">{env.label}</code>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0 font-mono">
                  {env.value ? (env.value.startsWith("***") ? env.value : `${env.value.substring(0, 12)}...`) : env.required ? "MANQUANTE" : "optionnel"}
                </span>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 bg-amber-50 border-t border-amber-100">
            <p className="text-xs text-amber-700 leading-relaxed">
              <strong>SANITY_API_WRITE_TOKEN</strong> manquant = les toggles featured/status ne fonctionneront pas.
              Cree un token &quot;Editor&quot; dans{" "}
              <a href="https://sanity.io/manage" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                sanity.io/manage
              </a>{" "}
              et ajoute-le dans Vercel.
            </p>
          </div>
        </div>

        {/* Liens utiles */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-4">Liens utiles</h2>
          <div className="space-y-2">
            {[
              { label: "Sanity Studio", href: "/studio", ext: true },
              { label: "Sanity Dashboard", href: "https://sanity.io/manage", ext: true },
              { label: "Vercel Dashboard", href: "https://vercel.com/dashboard", ext: true },
              { label: "Google Analytics", href: "https://analytics.google.com", ext: true },
              { label: "Google Search Console", href: "https://search.google.com/search-console", ext: true },
              { label: "Clerk Dashboard", href: "https://dashboard.clerk.com", ext: true },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target={link.ext ? "_blank" : undefined}
                rel={link.ext ? "noopener noreferrer" : undefined}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-all text-sm font-medium text-slate-700 group"
              >
                <span>{link.label}</span>
                <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Info sitemap */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-2">SEO & Indexation</h2>
          <p className="text-sm text-slate-500 mb-4">Fichiers auto-generes par Next.js a chaque deploy.</p>
          <div className="space-y-2">
            {[
              { label: "sitemap.xml", path: "/sitemap.xml" },
              { label: "robots.txt", path: "/robots.txt" },
            ].map((file) => (
              <div key={file.path} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50">
                <code className="text-xs font-mono text-slate-600">{file.path}</code>
                <span className="text-xs font-semibold text-green-500 bg-green-50 px-2 py-0.5 rounded-md">Actif</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
