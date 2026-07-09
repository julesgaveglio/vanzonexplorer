import type { Metadata } from "next";
import Image from "next/image";
import { getResource } from "@/lib/resources";
import ResourceDownloadForm from "@/components/resources/ResourceDownloadForm";

const LOGO =
  "https://cdn.sanity.io/images/lewexa74/production/9de5b0e768fa1fcc5ea5aa6f41ac816c249af9b0-1042x417.png?auto=format&q=82";

export const metadata: Metadata = {
  title: "Telecharge ta ressource — Vanzon Explorer",
  robots: { index: false, follow: false },
};

export default function RessourcesPage({
  searchParams,
}: {
  searchParams: { ressource?: string; source?: string };
}) {
  const resource = getResource(searchParams.ressource);
  const source = searchParams.source || "facebook";

  return (
    <section className="py-20 bg-white min-h-screen">
      <div className="max-w-lg mx-auto px-6">
        <div className="text-center mb-8">
          <Image
            src={LOGO}
            alt="Vanzon Explorer"
            width={160}
            height={48}
            className="h-10 w-auto mx-auto mb-8"
          />

          {resource ? (
            <>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-3 leading-tight">
                Telecharge ta ressource
              </h1>
              <p className="text-slate-500 text-lg leading-relaxed">
                {resource.title}
                {resource.description ? ` — ${resource.description}` : ""}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-3 leading-tight">
                Ressource introuvable
              </h1>
              <p className="text-slate-500 text-lg leading-relaxed">
                Le lien utilise ne pointe vers aucune ressource disponible.
              </p>
            </>
          )}
        </div>

        {resource && (
          <ResourceDownloadForm ressource={resource.slug} source={source} />
        )}
      </div>
    </section>
  );
}
