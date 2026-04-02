/**
 * quality-score.ts
 * Calcule un score de qualité 0-100 pour un article road trip.
 */

interface ScoredArticle {
  title?: string;
  seoTitle?: string;
  seoDescription?: string;
  chapeau?: string;
  faqItems?: unknown[];
  jours?: Array<{
    spots?: Array<{
      photo?: unknown;
      description?: string;
      wikiExcerpt?: string;
    }>;
  }>;
  summary_80w?: string;
  geojson?: string;
  duree?: number;
}

interface ScoreBreakdown {
  total: number;
  details: Record<string, { score: number; max: number; label: string }>;
}

export function calculateQualityScore(article: ScoredArticle): ScoreBreakdown {
  const details: ScoreBreakdown["details"] = {};

  // 1. Titre SEO (10 pts)
  const hasSeoTitle = !!(article.seoTitle && article.seoTitle.length >= 30 && article.seoTitle.length <= 70);
  details.seoTitle = { score: hasSeoTitle ? 10 : (article.title ? 5 : 0), max: 10, label: "Titre SEO" };

  // 2. Meta description (10 pts)
  const hasMetaDesc = !!(article.seoDescription && article.seoDescription.length >= 120 && article.seoDescription.length <= 155);
  details.metaDesc = { score: hasMetaDesc ? 10 : (article.seoDescription ? 5 : 0), max: 10, label: "Meta description" };

  // 3. Chapeau answer-first (10 pts)
  details.chapeau = { score: article.chapeau && article.chapeau.length >= 50 ? 10 : 0, max: 10, label: "Chapeau" };

  // 4. Nombre de spots avec description (20 pts)
  const allSpots = (article.jours || []).flatMap(j => j.spots || []);
  const spotsWithDesc = allSpots.filter(s => s.description && s.description.length >= 30);
  const spotScore = Math.min(20, Math.round((spotsWithDesc.length / Math.max(1, allSpots.length)) * 20));
  details.spots = { score: spotScore, max: 20, label: "Spots avec description" };

  // 5. Photos (20 pts)
  const spotsWithPhoto = allSpots.filter(s => s.photo);
  const photoRatio = allSpots.length > 0 ? spotsWithPhoto.length / allSpots.length : 0;
  details.photos = { score: Math.round(photoRatio * 20), max: 20, label: "Photos de spots" };

  // 6. FAQ (15 pts)
  const faqCount = (article.faqItems || []).length;
  details.faq = { score: faqCount >= 5 ? 15 : faqCount >= 3 ? 10 : faqCount >= 1 ? 5 : 0, max: 15, label: "FAQ" };

  // 7. Résumé 80 mots (10 pts)
  details.summary = { score: article.summary_80w && article.summary_80w.split(" ").length >= 50 ? 10 : 0, max: 10, label: "Résumé 80 mots" };

  // 8. GeoJSON valide (5 pts)
  let geojsonValid = false;
  try {
    if (article.geojson) {
      const parsed = JSON.parse(article.geojson);
      geojsonValid = parsed.type === "FeatureCollection" && Array.isArray(parsed.features);
    }
  } catch {}
  details.geojson = { score: geojsonValid ? 5 : 0, max: 5, label: "GeoJSON valide" };

  const total = Object.values(details).reduce((sum, d) => sum + d.score, 0);

  return { total: Math.min(100, total), details };
}
