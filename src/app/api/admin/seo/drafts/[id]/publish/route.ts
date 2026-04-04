// src/app/api/admin/seo/drafts/[id]/publish/route.ts
// Publie un brouillon directement sur Sanity CMS (bypasse la file d'attente)
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { adminWriteClient } from "@/lib/sanity/adminClient";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

// ── Helpers ────────────────────────────────────────────────────────────────────

function randomKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

function readingTime(html: string): string {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»");
}

function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, "").trim());
}

type MarkDef = { _key: string; _type: string; href: string };
type Span = { _type: "span"; _key: string; text: string; marks: string[] };

function makeSpan(text: string, marks: string[] = []): Span {
  return { _type: "span", _key: randomKey(), text: decodeHtmlEntities(text), marks };
}

function makeBlock(style: string, children: Span[], markDefs: MarkDef[], listItem?: string) {
  const block: Record<string, unknown> = {
    _type: "block",
    _key: randomKey(),
    style,
    children,
    markDefs,
  };
  if (listItem) {
    block.listItem = listItem;
    block.level = 1;
  }
  return block;
}

/** Parse inline HTML (p/li/blockquote inner content) → Sanity spans */
function parseInline(html: string, markDefs: MarkDef[]): Span[] {
  const spans: Span[] = [];
  const tokenRe = /(<[^>]+>)|([^<]+)/g;
  const markStack: string[] = [];
  let currentLinkKey: string | null = null;
  let m: RegExpExecArray | null;

  while ((m = tokenRe.exec(html)) !== null) {
    const [, tag, text] = m;

    if (tag) {
      const lower = tag.toLowerCase().replace(/\s+/g, " ");
      if (lower === "<strong>" || lower === "<b>") {
        markStack.push("strong");
      } else if (lower === "</strong>" || lower === "</b>") {
        const i = markStack.lastIndexOf("strong");
        if (i !== -1) markStack.splice(i, 1);
      } else if (lower === "<em>" || lower === "<i>") {
        markStack.push("em");
      } else if (lower === "</em>" || lower === "</i>") {
        const i = markStack.lastIndexOf("em");
        if (i !== -1) markStack.splice(i, 1);
      } else if (lower.startsWith("<a ")) {
        const hrefM = tag.match(/href=["']([^"']+)["']/i);
        if (hrefM) {
          const key = randomKey();
          markDefs.push({ _key: key, _type: "link", href: hrefM[1] });
          markStack.push(key);
          currentLinkKey = key;
        }
      } else if (lower === "</a>") {
        if (currentLinkKey) {
          const i = markStack.lastIndexOf(currentLinkKey);
          if (i !== -1) markStack.splice(i, 1);
          currentLinkKey = null;
        }
      } else if (lower === "<br>" || lower === "<br/>") {
        spans.push(makeSpan("\n", [...markStack]));
      }
      // skip other tags (span, etc.)
    } else if (text) {
      const decoded = decodeHtmlEntities(text);
      if (decoded) spans.push(makeSpan(decoded, [...markStack]));
    }
  }

  // Merge adjacent spans with same marks to keep blocks clean
  const merged: Span[] = [];
  for (const span of spans) {
    const prev = merged[merged.length - 1];
    if (prev && JSON.stringify(prev.marks) === JSON.stringify(span.marks)) {
      prev.text += span.text;
    } else {
      merged.push({ ...span, _key: randomKey() });
    }
  }

  return merged;
}

function pushListItems(inner: string, listType: "bullet" | "number", blocks: unknown[]) {
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m: RegExpExecArray | null;
  while ((m = liRe.exec(inner)) !== null) {
    const markDefs: MarkDef[] = [];
    const spans = parseInline(m[1], markDefs);
    if (spans.length) blocks.push(makeBlock("normal", spans, markDefs, listType));
  }
}

// ── Convertisseur HTML → Portable Text ───────────────────────────────────────

function htmlToPortableText(html: string): unknown[] {
  const blocks: unknown[] = [];

  // Strip script/style
  const content = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  // We process the HTML by splitting on block-level opening tags
  // then match each block pattern
  const blockRe =
    /<(h[1-6])\b[^>]*>([\s\S]*?)<\/h[1-6]>|<(p)\b[^>]*>([\s\S]*?)<\/p>|<(blockquote)\b[^>]*>([\s\S]*?)<\/blockquote>|<(ul)\b[^>]*>([\s\S]*?)<\/ul>|<(ol)\b[^>]*>([\s\S]*?)<\/ol>/gi;

  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(content)) !== null) {
    // h1-h6
    if (m[1]) {
      const level = m[1].toLowerCase();
      if (level === "h1") continue;
      if (level === "h2" || level === "h3") {
        const text = stripTags(m[2]);
        if (text) blocks.push(makeBlock(level, [makeSpan(text)], []));
      }
      continue;
    }
    // p
    if (m[3]) {
      const markDefs: MarkDef[] = [];
      const spans = parseInline(m[4], markDefs);
      if (spans.length) blocks.push(makeBlock("normal", spans, markDefs));
      continue;
    }
    // blockquote
    if (m[5]) {
      const markDefs: MarkDef[] = [];
      const inner = m[6].replace(/<p[^>]*>/gi, "").replace(/<\/p>/gi, " ");
      const spans = parseInline(inner, markDefs);
      if (spans.length) blocks.push(makeBlock("blockquote", spans, markDefs));
      continue;
    }
    // ul
    if (m[7]) {
      pushListItems(m[8], "bullet", blocks);
      continue;
    }
    // ol
    if (m[9]) {
      pushListItems(m[10], "number", blocks);
      continue;
    }
  }

  return blocks;
}

// ── Inférer la catégorie depuis le target_url ─────────────────────────────────

function inferCategory(targetUrl?: string): string {
  if (!targetUrl) return "Business Van";
  if (targetUrl.includes("formation")) return "Business Van";
  if (targetUrl.includes("location") || targetUrl.includes("van")) return "Aménagement Van";
  if (targetUrl.includes("road-trip") || targetUrl.includes("roadtrip")) return "Road Trips";
  return "Business Van";
}

// ── Route POST ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const supabase = createSupabaseAdmin();

  // 1. Récupérer le brouillon
  const { data: draft, error: fetchErr } = await supabase
    .from("draft_articles")
    .select("*")
    .eq("id", params.id)
    .single();

  if (fetchErr || !draft) {
    return NextResponse.json({ error: "Brouillon introuvable" }, { status: 404 });
  }

  // 2. Convertir HTML → Portable Text
  const portableText = htmlToPortableText(draft.html_content);

  // 3. Préparer le document Sanity
  const slug = slugify(draft.title) || `article-${Date.now()}`;
  const category = draft.category || inferCategory(draft.target_url);
  const excerpt = (draft.excerpt || "").slice(0, 300);

  const sanityDoc = {
    _type: "article",
    title: draft.title,
    slug: { _type: "slug", current: slug },
    excerpt,
    category,
    readTime: readingTime(draft.html_content),
    content: portableText,
    publishedAt: new Date().toISOString(),
    featured: false,
    seoTitle: draft.title,
    seoDescription: excerpt.slice(0, 160),
  };

  // 4. Publier sur Sanity
  let sanityResult;
  try {
    sanityResult = await adminWriteClient.create(sanityDoc);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Erreur Sanity : ${msg}` }, { status: 500 });
  }

  // 5. Mettre à jour le statut du brouillon → "archived"
  await supabase
    .from("draft_articles")
    .update({ status: "archived" })
    .eq("id", params.id);

  const articleUrl = `https://vanzonexplorer.com/articles/${slug}`;
  return NextResponse.json({ ok: true, slug, sanityId: sanityResult._id, url: articleUrl });
}
