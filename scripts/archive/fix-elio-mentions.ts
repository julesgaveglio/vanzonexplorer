/**
 * Script one-shot : scanne tous les articles Sanity pour les mentions d'Elio
 * et les remplace avec des corrections contextuelles (conjugaison, cohérence).
 *
 * Usage : npx tsx scripts/fix-elio-mentions.ts [--dry-run]
 */

import { createClient } from "@sanity/client";
import { config } from "dotenv";
config({ path: ".env.local" });

const dryRun = process.argv.includes("--dry-run");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

// ── Corrections exactes par passage (old → new) ──
// Chaque entrée est un remplacement exact de texte dans les spans Portable Text
const exactFixes: [string, string][] = [
  // louer-van-surf-biarritz-guide
  [
    "](/formation) — Jules et Elio vous accompagnent de l'achat à la location rentable.",
    "](/formation) — Jules vous accompagne de l'achat à la location rentable.",
  ],
  // toilettes-seches-van-comparatif
  [
    ", Elio et moi. Pas l'autonomie à moitié",
    ". Pas l'autonomie à moitié",
  ],
  // pourquoi-louer-van-plutot-hotel-pays-basque
  [
    "Quand Elio et moi avons passé des dizaines de nuits à aménager Yoni, on voulait exactement ça",
    "Quand j'ai passé des dizaines de nuits à aménager Yoni, je voulais exactement ça",
  ],
  // vivre-en-van-a-lannee-retour-experience
  [
    "Avec Elio, ça fait maintenant plus de",
    "Ça fait maintenant plus de",
  ],
  // louer-un-van-pays-basque-guide (8 passages)
  [
    "Jules et Elio les ont construits eux-mêmes, vivent ici depuis des années et connaissent",
    "Jules les a construits lui-même, vit ici depuis des années et connaît",
  ],
  [
    "Jules et Elio louent",
    "Vanzon loue",
  ],
  [
    "le système dont Jules et Elio sont le plus fiers",
    "le système dont Jules est le plus fier",
  ],
  [
    "Jules et Elio te font le tour du van à la prise en main. Ils expliquent le fonctionnement de la cuisine, de l'électricité, du li",
    "Jules te fait le tour du van à la prise en main. Il explique le fonctionnement de la cuisine, de l'électricité, du li",
  ],
  [
    "Jules et Elio privilégient",
    "Vanzon privilégie",
  ],
  [
    "Jules et Elio privilèg",
    "Vanzon privilèg",
  ],
  [
    "Jules et Elio expliquent les points d",
    "Jules explique les points d",
  ],
  [
    "Préviens Jules et Elio lors de la réservation. Ils demandent",
    "Préviens Jules lors de la réservation. Il demande",
  ],
  [
    "Jules et Elio répondent",
    "Jules répond",
  ],
  // revenus-location-van-yescapa-chiffres-reels
  [
    "par Jules et Elio, avec accès direct WhatsApp",
    "par Jules, avec accès direct WhatsApp",
  ],
  [
    "Vous ne partez pas seul — vous suivez",
    "Vous ne partez pas seul — vous suivez",
  ],
  // optimiser-taux-occupation-van-location
  [
    "Chez Vanzon, Elio gère les remises de clés et états des lieux",
    "Chez Vanzon, les remises de clés et états des lieux sont systématisés",
  ],
  // prix-van-amenage-2025 - need to find exact passage
  // Generic fallbacks for any remaining "Elio" mentions
];

// ── Types Portable Text simplifiés ──
interface PTSpan {
  _type: "span";
  _key: string;
  text: string;
  marks?: string[];
}

interface PTBlock {
  _type: "block";
  _key: string;
  children?: PTSpan[];
  style?: string;
  [key: string]: unknown;
}

type PTContent = PTBlock | { _type: string; [key: string]: unknown };

// ── Appliquer les corrections exactes sur un texte ──
function fixText(text: string): string {
  let result = text;
  for (const [oldStr, newStr] of exactFixes) {
    if (result.includes(oldStr)) {
      result = result.replace(oldStr, newStr);
    }
  }
  // Fallback generique si encore des mentions d'Elio
  if (/\bElio\b/i.test(result)) {
    // Patterns génériques avec correction de conjugaison
    result = result.replace(/Jules\s+et\s+Elio\s+([a-zéèêëàâ]+ent)\b/gi, (_, verb) => {
      // "xxxent" → "xxxe" (3ème personne singulier)
      const singular = verb.replace(/ent$/, "e");
      return `Jules ${singular}`;
    });
    result = result.replace(/Jules\s+(?:et|&)\s+Elio/gi, "Jules");
    result = result.replace(/Elio\s+(?:et|&)\s+Jules/gi, "Jules");
    result = result.replace(/\bElio Dubernet\b/gi, "Jules Gaveglio");
    result = result.replace(/\bElio\b/gi, "Jules");
    // Nettoyage "Jules et Jules" ou "Jules Jules"
    result = result.replace(/Jules\s+(?:et|&)\s+Jules/g, "Jules");
    result = result.replace(/Jules,\s*Jules/g, "Jules");
  }
  return result;
}

// ── Vérifier si un article contient "Elio" ──
function articleContainsElio(article: {
  title?: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  content?: PTContent[];
}): boolean {
  const regex = /\bElio\b/i;
  if (article.title && regex.test(article.title)) return true;
  if (article.excerpt && regex.test(article.excerpt)) return true;
  if (article.seoTitle && regex.test(article.seoTitle)) return true;
  if (article.seoDescription && regex.test(article.seoDescription)) return true;
  if (article.content) {
    for (const block of article.content) {
      if (block._type === "block" && (block as PTBlock).children) {
        for (const child of (block as PTBlock).children!) {
          if (child._type === "span" && regex.test(child.text)) return true;
        }
      }
    }
  }
  return false;
}

// ── Patcher le contenu Portable Text ──
function fixContent(content: PTContent[]): PTContent[] {
  return content.map((block) => {
    if (block._type === "block" && (block as PTBlock).children) {
      const ptBlock = block as PTBlock;
      return {
        ...ptBlock,
        children: ptBlock.children!.map((child) => {
          if (child._type === "span" && /\bElio\b/i.test(child.text)) {
            return { ...child, text: fixText(child.text) };
          }
          return child;
        }),
      };
    }
    return block;
  });
}

// ── Main ──
async function main() {
  console.log(dryRun ? "🔍 MODE DRY-RUN (aucune modification)\n" : "✏️  MODE ÉCRITURE\n");

  const query = `*[_type in ["article", "roadTripArticle"]]{
    _id,
    _type,
    title,
    "slug": slug.current,
    excerpt,
    seoTitle,
    seoDescription,
    content
  }`;

  const allArticles = await client.fetch(query) || [];
  console.log(`📊 ${allArticles.length} articles trouvés au total\n`);

  let found = 0;
  let patched = 0;

  for (const article of allArticles) {
    if (!articleContainsElio(article)) continue;
    found++;

    console.log(`\n🔴 "${article.title}" (${article.slug || article._id})`);

    // Afficher les corrections prévues
    if (article.content) {
      for (const block of article.content) {
        if (block._type === "block" && block.children) {
          for (const child of block.children) {
            if (child._type === "span" && /\bElio\b/i.test(child.text)) {
              const original = child.text.substring(0, 150);
              const fixed = fixText(child.text).substring(0, 150);
              console.log(`   AVANT : ...${original}...`);
              console.log(`   APRÈS : ...${fixed}...`);
              console.log();
            }
          }
        }
      }
    }

    // Construire le patch
    const patches: Record<string, unknown> = {};
    if (article.title && /\bElio\b/i.test(article.title)) {
      patches.title = fixText(article.title);
      console.log(`   title: "${article.title}" → "${patches.title}"`);
    }
    if (article.excerpt && /\bElio\b/i.test(article.excerpt)) {
      patches.excerpt = fixText(article.excerpt);
      console.log(`   excerpt: patché`);
    }
    if (article.seoTitle && /\bElio\b/i.test(article.seoTitle)) {
      patches.seoTitle = fixText(article.seoTitle);
      console.log(`   seoTitle: patché`);
    }
    if (article.seoDescription && /\bElio\b/i.test(article.seoDescription)) {
      patches.seoDescription = fixText(article.seoDescription);
      console.log(`   seoDescription: patché`);
    }

    if (article.content?.some((b: PTContent) =>
      b._type === "block" && (b as PTBlock).children?.some(
        (c: PTSpan) => c._type === "span" && /\bElio\b/i.test(c.text)
      )
    )) {
      patches.content = fixContent(article.content);
      console.log(`   content: patché`);
    }

    if (Object.keys(patches).length > 0 && !dryRun) {
      await client.patch(article._id).set(patches).commit();
      patched++;
      console.log(`   ✅ Sauvegardé dans Sanity`);
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`📋 Résumé : ${found} articles avec "Elio" trouvés`);
  if (!dryRun) {
    console.log(`✅ ${patched} articles patchés avec succès`);
  } else {
    console.log(`ℹ️  Relance sans --dry-run pour appliquer`);
  }
}

main().catch((err) => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});
