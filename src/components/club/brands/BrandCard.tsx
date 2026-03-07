import Link from "next/link";

interface BrandCardProps {
  brand: {
    name: string;
    slug: string;
    logo: string;
    isPartner: boolean;
    activeOffers: number;
  };
}

export default function BrandCard({ brand }: BrandCardProps) {
  const hasLogo = brand.logo.startsWith("http");

  return (
    <Link href={`/club/marques/${brand.slug}`}>
      <div className="rounded-xl border border-border bg-white p-6 text-center transition hover:border-rust/30">
        <div className="mx-auto w-20 h-20 rounded-full bg-cream border border-border/30 overflow-hidden flex items-center justify-center">
          {hasLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-display text-3xl text-earth">{brand.name.charAt(0)}</span>
          )}
        </div>
        <h3 className="mt-4 font-medium text-earth">{brand.name}</h3>
        <p className="mt-1 text-sm text-muted">{brand.activeOffers} offres actives</p>
        {brand.isPartner && (
          <span className="mt-2 inline-block rounded-full bg-sage/10 px-2 py-1 text-xs font-medium text-sage">
            Partenaire officiel
          </span>
        )}
      </div>
    </Link>
  );
}
