// Classification du canal d'acquisition — SERVEUR uniquement.
// Détermine d'où vient un visiteur à partir de son first-touch (UTM + referrer).
// Centralisé ici pour pouvoir ajuster la logique sans redéployer le client.

export type Channel =
  | "google-ads"
  | "meta-ads"
  | "meta-organic"
  | "organic"
  | "referral"
  | "campaign"
  | "direct";

interface FirstTouchInput {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  referrer?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
}

const SEARCH_ENGINES = ["google.", "bing.", "duckduckgo.", "yahoo.", "ecosia.", "qwant.", "search.brave"];
const META_DOMAINS = ["facebook.", "instagram.", "l.facebook", "lm.facebook", "l.instagram", "fb.", "t.co"];

function has(value: string | null | undefined, ...needles: string[]): boolean {
  if (!value) return false;
  const v = value.toLowerCase();
  return needles.some((n) => v.includes(n));
}

export function classifyChannel(ft: FirstTouchInput): Channel {
  const source = ft.utm_source?.toLowerCase() ?? "";
  const medium = ft.utm_medium?.toLowerCase() ?? "";
  const referrer = ft.referrer ?? "";

  const isPaidMedium = has(medium, "cpc", "ppc", "paid", "paidsearch", "paid_social", "paidsocial");

  // 1. Google Ads — gclid ou UTM google + medium payant
  if (ft.gclid || (has(source, "google") && isPaidMedium)) {
    return "google-ads";
  }

  // 2. Meta Ads — fbclid ou UTM facebook/instagram + medium payant
  if (
    ft.fbclid ||
    (has(source, "facebook", "instagram", "meta", "fb", "ig") && isPaidMedium)
  ) {
    return "meta-ads";
  }

  // 3. Autre campagne UTM taguée (newsletter, partenaire, etc.)
  if (source || medium) {
    if (has(source, "facebook", "instagram", "meta")) return "meta-organic";
    return "campaign";
  }

  // 4. Pas d'UTM — on classe via le referrer
  if (referrer) {
    if (has(referrer, ...SEARCH_ENGINES)) return "organic";
    if (has(referrer, ...META_DOMAINS)) return "meta-organic";
    return "referral";
  }

  // 5. Ni UTM ni referrer → accès direct
  return "direct";
}

// Libellés lisibles pour le dashboard
export const CHANNEL_LABELS: Record<Channel, string> = {
  "google-ads": "Google Ads",
  "meta-ads": "Meta Ads (payant)",
  "meta-organic": "Meta (organique)",
  organic: "SEO / Organique",
  referral: "Sites référents",
  campaign: "Campagne taguée",
  direct: "Direct",
};
