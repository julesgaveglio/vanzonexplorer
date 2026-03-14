"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderProducts, toggleProductActive } from "../../actions";

interface Product {
  id: string;
  name: string;
  description: string | null;
  main_image_url: string | null;
  promo_price: number;
  original_price: number;
  promo_code: string | null;
  is_active: boolean;
  is_featured: boolean;
  priority_score: number;
  brand_id: { name: string } | string | null;
}

function DragHandle() {
  return (
    <div className="flex flex-col gap-0.5 cursor-grab active:cursor-grabbing touch-none px-1">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`block w-1 h-1 rounded-full bg-slate-300 ${i % 2 === 0 ? "" : "ml-1.5"}`} />
      ))}
    </div>
  );
}

function SortableRow({
  product,
  onPending,
  pendingId,
}: {
  product: Product;
  onPending: (id: string) => void;
  pendingId: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  const brand = typeof product.brand_id === "object" && product.brand_id !== null
    ? (product.brand_id as { name: string }).name
    : "—";

  const isPending = pendingId === product.id;

  return (
    <tr
      ref={setNodeRef}
      style={style as React.CSSProperties}
      className={`border-b border-slate-50 transition-colors ${isDragging ? "bg-violet-50 shadow-lg" : "hover:bg-slate-50/60"}`}
    >
      {/* Drag handle */}
      <td className="pl-4 pr-2 py-3 w-8">
        <div {...attributes} {...listeners}>
          <DragHandle />
        </div>
      </td>

      {/* Image + nom */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
            {product.main_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.main_image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-slate-300 text-sm">📦</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate max-w-[160px]">{product.name}</p>
            <p className="text-xs text-slate-400 truncate max-w-[160px]">{brand}</p>
          </div>
        </div>
      </td>

      {/* Prix */}
      <td className="px-3 py-3">
        <p className="text-sm font-bold text-violet-600">{Number(product.promo_price).toFixed(0)}€</p>
        <p className="text-xs text-red-400 line-through">{Number(product.original_price).toFixed(0)}€</p>
      </td>

      {/* Code */}
      <td className="px-3 py-3">
        {product.promo_code ? (
          <span className="font-mono text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-lg whitespace-nowrap">
            {product.promo_code}
          </span>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        )}
      </td>

      {/* Badges */}
      <td className="px-3 py-3">
        <div className="flex gap-1.5 flex-wrap">
          {product.is_featured && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">UNE</span>
          )}
          {!product.is_active && (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">INACTIF</span>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPending(product.id)}
            disabled={isPending}
            title={product.is_active ? "Mettre en attente" : "Réactiver"}
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              product.is_active
                ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
            }`}
          >
            {isPending ? "…" : product.is_active ? "En attente" : "Réactiver"}
          </button>
          <Link
            href={`/admin/club/produits/${product.id}`}
            className="text-xs font-medium text-slate-400 hover:text-violet-600 bg-slate-50 hover:bg-violet-50 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            Modifier
          </Link>
        </div>
      </td>
    </tr>
  );
}

export default function ProductsOrderManager({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, startSaving] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "ok" | "error">("idle");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setProducts((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
    setIsDirty(true);
    setSaveStatus("idle");
  }

  async function handlePending(id: string) {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    setPendingId(id);
    try {
      await toggleProductActive(id, !product.is_active);
      setProducts((prev) =>
        prev.map((p) => p.id === id ? { ...p, is_active: !p.is_active } : p)
      );
    } finally {
      setPendingId(null);
    }
  }

  function handleSave() {
    setSaveStatus("idle");
    startSaving(async () => {
      // Assign priority_score = (total - index) * 10 so top = highest score
      const items = products.map((p, i) => ({
        id: p.id,
        priority_score: (products.length - i) * 10,
      }));
      const result = await reorderProducts(items);
      if (result.success) {
        setIsDirty(false);
        setSaveStatus("ok");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    });
  }

  const active = products.filter((p) => p.is_active);
  const pending = products.filter((p) => !p.is_active);

  return (
    <div className="space-y-6">
      {/* Header bar avec bouton enregistrer */}
      {isDirty && (
        <div className="flex items-center justify-between bg-violet-50 border border-violet-200 rounded-2xl px-5 py-3">
          <p className="text-sm font-medium text-violet-700">
            Ordre modifié — enregistre pour mettre à jour le site.
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm font-semibold text-white px-5 py-2 rounded-xl transition-all disabled:opacity-60 flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)", boxShadow: "0 4px 14px rgba(139,92,246,0.35)" }}
          >
            {saving && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {saving ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        </div>
      )}

      {saveStatus === "ok" && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 text-sm font-medium text-emerald-700">
          ✅ Ordre enregistré — le site est mis à jour.
        </div>
      )}
      {saveStatus === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3 text-sm font-medium text-red-700">
          ⚠️ Erreur lors de l&apos;enregistrement.
        </div>
      )}

      {/* Produits actifs — draggable */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <h2 className="font-bold text-slate-900 text-sm">Actifs — {active.length} produit{active.length > 1 ? "s" : ""}</h2>
          <span className="text-xs text-slate-400 ml-1">Glisse pour réordonner</span>
        </div>

        {active.length === 0 ? (
          <p className="px-6 py-8 text-center text-slate-400 text-sm">Aucun produit actif.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={active.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="w-8" />
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">Produit</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">Prix</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">Code</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">Tags</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((product) => (
                    <SortableRow
                      key={product.id}
                      product={product}
                      onPending={handlePending}
                      pendingId={pendingId}
                    />
                  ))}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Produits en attente */}
      {pending.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden opacity-70">
          <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <h2 className="font-bold text-slate-900 text-sm">En attente — {pending.length} produit{pending.length > 1 ? "s" : ""}</h2>
            <span className="text-xs text-slate-400 ml-1">Non affichés sur le site</span>
          </div>
          <table className="w-full">
            <tbody>
              {pending.map((product) => (
                <SortableRow
                  key={product.id}
                  product={product}
                  onPending={handlePending}
                  pendingId={pendingId}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
