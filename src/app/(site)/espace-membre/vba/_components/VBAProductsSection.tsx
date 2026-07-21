"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink, Package, Wrench } from "lucide-react";
import type { VBAProduct } from "@/lib/airtable/vba-products";

function formatPrice(price: number | null): string | null {
  if (price == null) return null;
  return price.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function ProductPill({ product, onOpen }: { product: VBAProduct; onOpen: () => void }) {
  const price = formatPrice(product.price);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group snap-start shrink-0 w-[136px] sm:w-[150px] text-left bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-[var(--gold)] hover:shadow-md transition-all active:scale-[0.98]"
    >
      <div className="relative aspect-square bg-white">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Package className="w-8 h-8" />
          </div>
        )}
        {price && (
          <span className="absolute bottom-1.5 right-1.5 bg-white/95 backdrop-blur-sm text-slate-900 text-[11px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
            {price}
          </span>
        )}
      </div>
      <div className="px-2.5 py-2">
        <p className="text-xs font-semibold text-slate-700 leading-snug line-clamp-2 group-hover:text-slate-900">
          {product.name}
        </p>
      </div>
    </button>
  );
}

function ProductRow({
  title,
  icon,
  products,
  onOpen,
}: {
  title: string;
  icon: React.ReactNode;
  products: VBAProduct[];
  onOpen: (p: VBAProduct) => void;
}) {
  if (products.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[var(--gold)]">{icon}</span>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <span className="text-xs font-medium text-slate-400">({products.length})</span>
      </div>
      <div className="flex gap-3 overflow-x-auto snap-x pb-2 -mx-1 px-1 [scrollbar-width:thin]">
        {products.map((p) => (
          <ProductPill key={p.id} product={p} onOpen={() => onOpen(p)} />
        ))}
      </div>
    </div>
  );
}

function ProductModal({ product, onClose }: { product: VBAProduct; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const price = formatPrice(product.price);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[88vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {product.image && (
          <div className="relative aspect-[16/11] bg-white rounded-t-3xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain p-4"
            />
          </div>
        )}

        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h4 className="text-lg font-bold text-slate-900 leading-snug pr-6">
              {product.name}
            </h4>
            {price && (
              <span className="shrink-0 text-lg font-black text-slate-900">{price}</span>
            )}
          </div>

          {product.description && (
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line mb-5">
              {product.description}
            </p>
          )}

          {product.url && (
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
            >
              Commander
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VBAProductsSection({
  materials,
  tools,
}: {
  materials: VBAProduct[];
  tools: VBAProduct[];
}) {
  const [selected, setSelected] = useState<VBAProduct | null>(null);

  if (materials.length === 0 && tools.length === 0) return null;

  return (
    <div className="border-t border-slate-100 pt-4 sm:pt-6 mb-4 sm:mb-6">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Matériel &amp; outils de cette étape
      </p>
      <div className="space-y-5">
        <ProductRow
          title="Matériel"
          icon={<Package className="w-4 h-4" />}
          products={materials}
          onOpen={setSelected}
        />
        <ProductRow
          title="Outils"
          icon={<Wrench className="w-4 h-4" />}
          products={tools}
          onOpen={setSelected}
        />
      </div>

      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
