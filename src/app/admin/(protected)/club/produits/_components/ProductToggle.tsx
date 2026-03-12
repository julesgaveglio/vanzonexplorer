"use client";

import { useTransition } from "react";
import { toggleProductFeatured, toggleProductActive } from "../../actions";

export default function ProductToggle({
  id,
  field,
  value,
}: {
  id: string;
  field: "featured" | "active";
  value: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      if (field === "featured") await toggleProductFeatured(id, !value);
      else await toggleProductActive(id, !value);
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
        value
          ? field === "featured" ? "bg-amber-400" : "bg-emerald-400"
          : "bg-slate-200"
      } ${isPending ? "opacity-50" : ""}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          value ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}
