import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `https://vanzonexplorer.com${item.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
        {items.map((item, index) => (
          <span key={index} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-slate-300">/</span>}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-slate-700 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-700 font-medium">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
