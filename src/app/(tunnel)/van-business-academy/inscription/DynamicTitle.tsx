"use client";

import { useEffect, useState } from "react";

const FALLBACK_TITLE = "Donne-moi 13 minutes et je vais te montrer comment acheter un van à 15 000 € et le revendre entre 22 000 € et 27 000 €.";

export default function DynamicTitle() {
  const [title, setTitle] = useState(FALLBACK_TITLE);

  useEffect(() => {
    fetch("/api/vsl/active-title")
      .then((r) => r.json())
      .then((data) => {
        if (data.title) setTitle(data.title);
        if (data.id) {
          try {
            localStorage.setItem("vba_title_variant_id", data.id);
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // Highlight "13 minutes" and money amounts (€) in gold
  const parts = title.split(/(13 minutes|\d[\d\s]*€[^\s]*)/g);

  return (
    <h1 className="font-display text-[1.7rem] sm:text-4xl lg:text-[2.6rem] leading-[1.15] text-center text-white mb-6">
      {parts.map((part, i) =>
        /13 minutes|\d[\d\s]*€/.test(part) ? (
          <span
            key={i}
            style={{
              background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </h1>
  );
}
