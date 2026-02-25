import type { Metadata } from "next";
import { sanityFetch } from "@/lib/sanity/client";
import { getAllSaleVansQuery } from "@/lib/sanity/queries";
import type { VanCard as VanCardType } from "@/lib/sanity/types";
import VanCard from "@/components/van/VanCard";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Achat de vans aménagés",
  description:
    "Achetez un van aménagé au Pays Basque. Vans révisés, accompagnement personnalisé, financement possible.",
};

export default async function AchatPage() {
  const vans = await sanityFetch<VanCardType[]>(getAllSaleVansQuery);

  return (
    <>
      {/* ── Hero compact ── */}
      <section
        className="py-16 md:py-20"
        style={{
          background: "linear-gradient(160deg, #FFFBEB 0%, #FFF7ED 50%, #EFF6FF 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900">
            Achat de vans
          </h1>
          <p className="text-lg text-slate-500 mt-3 max-w-xl mx-auto">
            Trouvez le van de vos rêves. Tous nos véhicules sont révisés et prêts à partir.
          </p>
          {vans && vans.length > 0 && (
            <p className="text-sm text-slate-400 mt-2">
              {vans.length} van{vans.length > 1 ? "s" : ""} disponible{vans.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </section>

      {/* ── Grille de vans ── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          {vans && vans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vans.map((van) => (
                <VanCard key={van._id} van={van} mode="achat" />
              ))}
            </div>
          ) : (
            <div className="glass-card p-16 text-center max-w-lg mx-auto">
              <p className="text-4xl mb-4">🔑</p>
              <h2 className="text-xl font-semibold text-slate-900">
                Aucun van à vendre actuellement
              </h2>
              <p className="text-slate-500 mt-2">
                Revenez bientôt ou contactez-nous pour être informé des prochaines arrivées !
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
