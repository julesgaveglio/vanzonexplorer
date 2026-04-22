import { notFound } from "next/navigation";
import Link from "next/link";
import { getBrandBySlug, getProductsByBrand } from "@/lib/club/data";
import ProductCard from "@/components/club/products/ProductCard";
import { ChevronRight, ExternalLink, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BrandDetailPage({ params }: { params: { slug: string } }) {
  const brand = await getBrandBySlug(params.slug);
  if (!brand) notFound();

  const brandProducts = await getProductsByBrand(brand.slug);

  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-muted mb-8">
          <Link href="/club" className="hover:text-rust transition-colors">Club</Link>
          <ChevronRight className="w-3 h-3 text-muted/40" />
          <Link href="/club/marques" className="hover:text-rust transition-colors">Marques</Link>
          <ChevronRight className="w-3 h-3 text-muted/40" />
          <span className="text-earth">{brand.name}</span>
        </nav>

        <div className="bg-white rounded-2xl p-8 md:p-12 border border-border mb-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 flex-shrink-0 rounded-full bg-cream border border-border/30 overflow-hidden flex items-center justify-center">
              {brand.logo.startsWith("http") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-4xl text-earth">{brand.name[0]}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display text-4xl md:text-5xl tracking-wide text-earth">{brand.name}</h1>
                {brand.isPartner && (
                  <span className="inline-flex items-center gap-1 bg-sage/10 text-sage text-xs font-medium px-3 py-1.5 rounded-full">
                    <Award className="w-3 h-3" />Partenaire officiel
                  </span>
                )}
              </div>
              <p className="text-muted mt-3 leading-relaxed max-w-2xl">{brand.description}</p>
              <div className="flex items-center gap-4 mt-4">
                <span className="text-sm font-medium text-rust bg-rust/10 px-3 py-1 rounded-full">{brand.activeOffers} offres actives</span>
                <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-rust transition-colors flex items-center gap-1">
                  Visiter le site <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <h2 className="font-display text-3xl tracking-wide text-earth mb-8">Offres {brand.name}</h2>

        {brandProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {brandProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted text-lg">Aucune offre disponible pour le moment.</p>
            <Link href="/club/deals" className="mt-4 inline-block text-rust hover:underline text-sm font-medium">Voir toutes les offres</Link>
          </div>
        )}
      </div>
    </div>
  );
}
