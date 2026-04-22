import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug, getProductsByCategory } from "@/lib/club/data";
import ProductCard from "@/components/club/products/ProductCard";
import PromoCodeBlock from "@/components/club/products/PromoCodeBlock";
import ImageGallery from "@/components/club/products/ImageGallery";
import { ExternalLink, Shield, Star, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DealDetailPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const similarProducts = (await getProductsByCategory(product.category.slug))
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

  const galleryImages = [product.image, ...product.gallery];

  return (
    <div className="bg-cream">
      <nav className="mx-auto max-w-7xl px-4 py-4">
        <ol className="flex items-center gap-1 text-sm text-muted">
          <li><Link href="/club" className="transition-colors hover:text-earth">Club</Link></li>
          <li><ChevronRight className="h-3 w-3 text-muted/40" /></li>
          <li><Link href="/club/deals" className="transition-colors hover:text-earth">Offres</Link></li>
          <li><ChevronRight className="h-3 w-3 text-muted/40" /></li>
          <li><Link href={`/club/deals?category=${product.category.slug}`} className="transition-colors hover:text-earth">{product.category.name}</Link></li>
          <li><ChevronRight className="h-3 w-3 text-muted/40" /></li>
          <li className="truncate text-earth">{product.name}</li>
        </ol>
      </nav>

      <div className="mx-auto max-w-7xl px-4 pb-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <ImageGallery images={galleryImages} productName={product.name} />
          </div>

          <div>
            <p className="text-sm uppercase tracking-wider text-muted">{product.brand.name}</p>
            <h1 className="mt-2 font-display text-4xl tracking-wide text-earth md:text-5xl">{product.name}</h1>
            <p className="mt-4 leading-relaxed text-muted">{product.description}</p>

            <div className="mt-6 rounded-xl border border-border bg-white p-5">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-rust">{product.promoPrice} &euro;</span>
                <span className="text-lg text-muted line-through">{product.originalPrice} &euro;</span>
                <span className="rounded-full bg-rust px-3 py-1 text-sm font-bold text-cream">-{product.discount}%</span>
              </div>
              <p className="mt-2 flex items-center gap-1 text-xs text-sage">
                <Shield className="h-3.5 w-3.5" />
                Meilleur prix garanti
              </p>
            </div>

            {product.promoCode && (
              <div className="mt-6">
                <PromoCodeBlock code={product.promoCode} />
              </div>
            )}

            <div className="mt-6">
              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-rust py-4 text-center font-medium text-cream transition-colors hover:bg-rust-dark"
              >
                Voir l&apos;offre chez {product.brand.name}
                <ExternalLink className="h-4 w-4" />
              </a>
              <p className="mt-2 text-center text-xs text-muted">
                Vous serez redirigé vers le site de {product.brand.name}
              </p>
            </div>

            {product.whyThisDeal && (
              <div className="mt-8 rounded-xl bg-sage/10 p-5">
                <h3 className="flex items-center gap-2 font-medium text-earth">
                  <Star className="h-5 w-5 text-sage" />
                  Pourquoi ce deal ?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{product.whyThisDeal}</p>
              </div>
            )}
          </div>
        </div>

        {similarProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-8 font-display text-3xl tracking-wide text-earth">Produits similaires</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {similarProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
