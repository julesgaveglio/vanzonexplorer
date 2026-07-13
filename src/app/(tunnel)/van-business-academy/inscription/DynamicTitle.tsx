"use client";

import { useEffect, useState } from "react";

const FALLBACK_TITLE = "Donne-moi 13 minutes et je vais te montrer comment acheter un van à 15 000 € et le revendre entre 22 000 € et 27 000 €.";

// Keywords/phrases to highlight in gold — catches money, durations, and power words
const GOLD_PATTERNS = [
  /\d[\d\s]*€[^\s,.]*/g,                    // money: 15 000 €, 600€/mois
  /13 minutes/gi,                            // duration
  /\d+\s*%/g,                                // percentages: 90 %
  /plus rentable que l'immobilier/gi,
  /risque limité/gi,
  /4 étapes/gi,
  /de 0 à/gi,
  /erreurs? à \d[\d\s]*€/gi,
  /le deuxième.*le troisième/gi,
  /revenus? (?:locatifs?|passifs?)/gi,
  /en 4 étapes/gi,
  /tout change/gi,
  /sortir du salariat/gi,
  /(?:acheter|revendre).*(?:van|véhicule)/gi,
];

function highlightTitle(title: string): { text: string; gold: boolean }[] {
  // Find all match positions
  const highlights: [number, number][] = [];
  for (const pattern of GOLD_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(title)) !== null) {
      highlights.push([match.index, match.index + match[0].length]);
    }
  }

  if (highlights.length === 0) {
    return [{ text: title, gold: false }];
  }

  // Merge overlapping ranges
  highlights.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [highlights[0]];
  for (let i = 1; i < highlights.length; i++) {
    const last = merged[merged.length - 1];
    if (highlights[i][0] <= last[1]) {
      last[1] = Math.max(last[1], highlights[i][1]);
    } else {
      merged.push(highlights[i]);
    }
  }

  // Build segments
  const segments: { text: string; gold: boolean }[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (cursor < start) segments.push({ text: title.slice(cursor, start), gold: false });
    segments.push({ text: title.slice(start, end), gold: true });
    cursor = end;
  }
  if (cursor < title.length) segments.push({ text: title.slice(cursor), gold: false });

  return segments;
}

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

  const segments = highlightTitle(title);

  return (
    <h1 className="font-display text-[1.7rem] sm:text-4xl lg:text-[2.6rem] leading-[1.15] text-center text-white mb-6">
      {segments.map((seg, i) =>
        seg.gold ? (
          <span
            key={i}
            style={{
              background: "linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </h1>
  );
}
