import React from "react";
export { slugify } from "@/lib/slugify";
import { slugify } from "@/lib/slugify";
import type { FAQItem } from "@/components/seo/JsonLd";

// ── Types ──────────────────────────────────────────────────────────────────────

export type TOCHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type PortableBlock = {
  _type: string;
  _key: string;
  style?: string;
  children?: Array<{ _type: string; text?: string; marks?: string[] }>;
};

// ── Pure helpers ───────────────────────────────────────────────────────────────

export function getBlockText(block: PortableBlock): string {
  return block.children?.map((c) => c.text ?? "").join("") ?? "";
}

export function extractHeadings(content: PortableBlock[]): TOCHeading[] {
  return content
    .filter((b) => b._type === "block" && (b.style === "h2" || b.style === "h3"))
    .map((b) => ({
      id: slugify(getBlockText(b)),
      text: getBlockText(b),
      level: (b.style === "h2" ? 2 : 3) as 2 | 3,
    }));
}

export function extractFAQ(content: PortableBlock[]): FAQItem[] {
  const items: FAQItem[] = [];
  let inFAQ = false;
  let currentQ = "";
  let currentA = "";

  for (const block of content) {
    if (block._type !== "block") continue;
    const text = getBlockText(block);

    if (block.style === "h2") {
      if (inFAQ && currentQ) {
        items.push({ question: currentQ, answer: currentA.trim() });
        currentQ = "";
        currentA = "";
      }
      inFAQ = text.toLowerCase().includes("faq") || text.toLowerCase().includes("question");
      continue;
    }

    if (!inFAQ) continue;

    if (block.style === "h3") {
      if (currentQ) items.push({ question: currentQ, answer: currentA.trim() });
      currentQ = text;
      currentA = "";
    } else if (block.style === "normal") {
      currentA += (currentA ? " " : "") + text;
    }
  }

  if (currentQ) items.push({ question: currentQ, answer: currentA.trim() });
  return items;
}

/** Retourne uniquement les blocs AVANT le premier H2 "faq"/"question".
 *  Évite le doublon FAQ dans le corps + le composant ArticleFAQ. */
export function contentBeforeFAQ(content: PortableBlock[]): PortableBlock[] {
  const idx = content.findIndex(
    (b) =>
      b._type === "block" &&
      b.style === "h2" &&
      (getBlockText(b).toLowerCase().includes("faq") ||
        getBlockText(b).toLowerCase().includes("question"))
  );
  return idx === -1 ? content : content.slice(0, idx);
}

/** Retourne les blocs APRÈS la section FAQ (Conclusion typiquement). */
export function contentAfterFAQ(content: PortableBlock[]): PortableBlock[] {
  const faqIdx = content.findIndex(
    (b) =>
      b._type === "block" &&
      b.style === "h2" &&
      (getBlockText(b).toLowerCase().includes("faq") ||
        getBlockText(b).toLowerCase().includes("question"))
  );
  if (faqIdx === -1) return [];
  for (let i = faqIdx + 1; i < content.length; i++) {
    if (content[i]._type === "block" && content[i].style === "h2") {
      return content.slice(i);
    }
  }
  return [];
}

/** Split content at each H2 to enable CTA injection between sections */
export function splitBySections(content: PortableBlock[]): PortableBlock[][] {
  const sections: PortableBlock[][] = [];
  let current: PortableBlock[] = [];

  for (const block of content) {
    if (block.style === "h2" && current.length > 0) {
      sections.push(current);
      current = [block];
    } else {
      current.push(block);
    }
  }
  if (current.length > 0) sections.push(current);
  return sections;
}

/** Parse raw markdown links/bold/italic inside plain text blocks */
export function renderInlineMarkdown(text: string): React.ReactNode[] {
  const regex = /\*\*([^*\n]+?)\*\*|\*([^*\n]+?)\*|\[([^\]]+)\]\(([^)]+)\)/g;
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      result.push(
        <strong key={match.index} className="font-bold text-slate-800">
          {match[1]}
        </strong>
      );
    } else if (match[2] !== undefined) {
      result.push(
        <em key={match.index} className="italic text-slate-700">
          {match[2]}
        </em>
      );
    } else if (match[3] !== undefined && match[4] !== undefined) {
      const href = match[4];
      const isExternal = href.startsWith("http");
      result.push(
        <a
          key={match.index}
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="text-[#4D5FEC] underline underline-offset-2 hover:text-[#3B4FD4] transition-colors"
        >
          {match[3]}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) result.push(text.slice(lastIndex));
  return result.length > 0 ? result : [text];
}

// ── Category color map ─────────────────────────────────────────────────────────

export const categoryColorMap: Record<string, string> = {
  "Road Trips": "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
  "Aménagement Van": "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
  "Business Van": "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  "Achat Van": "bg-violet-50 text-violet-700 ring-1 ring-violet-200/60",
};

// ── Date formatter ─────────────────────────────────────────────────────────────

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
