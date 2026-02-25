import type { Metadata } from "next";
import { sanityFetch } from "@/lib/sanity/client";
import { getAllLocationVansQuery } from "@/lib/sanity/queries";
import type { VanCard as VanCardType } from "@/lib/sanity/types";
import VanCard from "@/components/van/VanCard";
import VanSlider from "@/components/van/VanSlider";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Location de vans aménagés | Vanzon Explorer",
  description:
    "Louez un van aménagé au Pays Basque. Vans tout équipés, assurance incluse, réservation simple via nos partenaires.",
};

const vanFeatures = [
  { icon: "https://iili.io/KGvOdtS.png", label: "3 sièges" },
  { icon: "https://iili.io/KGvOHAl.png", label: "2+1 couchages" },
  { icon: "https://iili.io/KGvO3o7.png", label: "Cuisine coulissante" },
  { icon: "https://iili.io/KGvOJN2.png", label: "Glacière portative" },
  { icon: "https://iili.io/KGvOFV9.png", label: "Toilette sèche" },
];


export default async function LocationPage() {
  const vans = await sanityFetch<VanCardType[]>(getAllLocationVansQuery);

  return (
    <>
      {/* ── Hero compact ── */}
      <section
        className="py-16 md:py-20"
        style={{
          background: "linear-gradient(160deg, #EFF6FF 0%, #F0FDFF 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900">
            Location de vans
          </h1>
          <p className="text-lg text-slate-500 mt-3 max-w-xl mx-auto">
            Explorez le Pays Basque en toute liberté avec nos vans aménagés tout équipés.
          </p>
          {vans && vans.length > 0 && (
            <p className="text-sm text-slate-400 mt-2">
              {vans.length} van{vans.length > 1 ? "s" : ""} disponible{vans.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </section>

      {/* ── Nos véhicules (Yoni & Xalbat) ── */}
      <section className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="badge-glass !px-4 !py-1.5 text-sm text-slate-500 font-medium mb-4 inline-block">
              Location
            </span>
            <h2 className="text-3xl font-bold text-slate-900">
              Nos véhicules
            </h2>
            <p className="text-slate-500 mt-2">
              Vans aménagés disponibles au Pays Basque
            </p>
          </div>
          <VanSlider />
        </div>
      </section>

      {/* ── Grille Sanity (vans dynamiques) ── */}
      {vans && vans.length > 0 && (
        <section className="bg-[#F8FAFC] py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vans.map((van) => (
                <VanCard key={van._id} van={van} mode="location" />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
