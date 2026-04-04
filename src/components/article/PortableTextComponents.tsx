import React from "react";
import Image from "next/image";
import { PortableText } from "@portabletext/react";
import { slugify } from "@/lib/slugify";
import { getBlockText, renderInlineMarkdown, type PortableBlock } from "@/lib/article-utils";
import { ArticleTable, groupTableBlocks } from "@/components/article/ArticleTable";

// ── makePortableComponents ─────────────────────────────────────────────────────

export function makePortableComponents(headingIds: Map<string, string>) {
  return {
    types: {
      image: ({
        value,
      }: {
        value?: {
          alt?: string;
          asset?: {
            url?: string;
            metadata?: { dimensions?: { width?: number; height?: number } };
          };
        };
      }) => {
        const src = value?.asset?.url;
        if (!src) return null;
        const dims = value?.asset?.metadata?.dimensions;
        const aspectClass =
          dims && dims.width && dims.height
            ? dims.width / dims.height > 1.5
              ? "aspect-[16/9]"
              : "aspect-[4/3]"
            : "aspect-[16/9]";
        return (
          <figure className="my-10 not-prose">
            <div
              className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden bg-slate-100`}
            >
              <Image
                src={src}
                alt={value?.alt ?? "Illustration de l'article"}
                fill
                sizes="(max-width: 768px) 100vw, 65vw"
                className="object-cover"
                loading="lazy"
              />
            </div>
            {value?.alt && (
              <figcaption className="text-center text-xs text-slate-400 mt-2.5 italic">
                {value.alt}
              </figcaption>
            )}
          </figure>
        );
      },
    },
    block: {
      h2: ({
        children,
        value,
      }: {
        children?: React.ReactNode;
        value?: PortableBlock;
      }) => {
        const text = value ? getBlockText(value) : "";
        const id = headingIds.get(text) ?? slugify(text);
        return (
          <h2 id={id} className="text-2xl font-black text-slate-900 mt-14 mb-5 scroll-mt-24">
            {children}
          </h2>
        );
      },
      h3: ({
        children,
        value,
      }: {
        children?: React.ReactNode;
        value?: PortableBlock;
      }) => {
        const text = value ? getBlockText(value) : "";
        const id = headingIds.get(text) ?? slugify(text);
        return (
          <h3 id={id} className="text-xl font-bold text-slate-900 mt-10 mb-4 scroll-mt-24">
            {children}
          </h3>
        );
      },
      blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="my-8 pl-5 border-l-4 border-[#4D5FEC] bg-blue-50/50 py-4 pr-5 rounded-r-xl italic text-slate-600 text-[17px] leading-relaxed">
          {children}
        </blockquote>
      ),
      normal: ({
        children,
        value,
      }: {
        children?: React.ReactNode;
        value?: PortableBlock;
      }) => {
        const text = value ? getBlockText(value) : "";
        const isWarning = text.startsWith("⚠️") || text.startsWith("🚫");
        const isTip = text.startsWith("💡") || text.startsWith("✅");
        const isInfo = text.startsWith("ℹ️") || text.startsWith("📋");

        if (isWarning) {
          return (
            <div className="my-6 flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-[15px] text-amber-800 leading-relaxed">
              <span className="flex-shrink-0 text-lg">⚠️</span>
              <p>{text.replace(/^⚠️\s*|^🚫\s*/, "")}</p>
            </div>
          );
        }
        if (isTip) {
          return (
            <div className="my-6 flex gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-[15px] text-emerald-800 leading-relaxed">
              <span className="flex-shrink-0 text-lg">{text.startsWith("💡") ? "💡" : "✅"}</span>
              <p>{text.replace(/^💡\s*|^✅\s*/, "")}</p>
            </div>
          );
        }
        if (isInfo) {
          return (
            <div className="my-6 flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-[15px] text-blue-800 leading-relaxed">
              <span className="flex-shrink-0 text-lg">
                {text.startsWith("ℹ️") ? "ℹ️" : "📋"}
              </span>
              <p>{text.replace(/^ℹ️\s*|^📋\s*/, "")}</p>
            </div>
          );
        }

        // Fallback: if block text contains raw markdown link syntax, render it
        const hasRawMarkdown = text.includes("[") && text.includes("](");
        if (hasRawMarkdown) {
          return (
            <p className="text-[18px] text-slate-600 leading-[1.75] mb-6">
              {renderInlineMarkdown(text)}
            </p>
          );
        }

        return <p className="text-[18px] text-slate-600 leading-[1.75] mb-6">{children}</p>;
      },
    },
    marks: {
      strong: ({ children }: { children?: React.ReactNode }) => (
        <strong className="font-bold text-slate-800">{children}</strong>
      ),
      em: ({ children }: { children?: React.ReactNode }) => (
        <em className="italic text-slate-700">{children}</em>
      ),
      link: ({
        children,
        value,
      }: {
        children?: React.ReactNode;
        value?: { href?: string; blank?: boolean };
      }) => (
        <a
          href={value?.href}
          target={value?.blank ? "_blank" : undefined}
          rel={value?.blank ? "noopener noreferrer" : undefined}
          className="text-[#4D5FEC] underline underline-offset-2 hover:text-[#3B4FD4] transition-colors"
        >
          {children}
        </a>
      ),
    },
  };
}

// ── renderBlocks: handles virtual table blocks + PortableText ──────────────────

export function renderBlocks(
  blocks: PortableBlock[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components: any
): React.ReactNode {
  const virtualBlocks = groupTableBlocks(blocks);
  return virtualBlocks.map((block, i) => {
    if (block._type === "table") {
      const tb = block as { _type: "table"; _key: string; rows: string[] };
      return <ArticleTable key={tb._key || i} rows={tb.rows} />;
    }
    const pb = block as PortableBlock;
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <PortableText key={pb._key || i} value={[pb] as any} components={components} />
    );
  });
}
