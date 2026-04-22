export const VSL_URL = "/van-business-academy/presentation";

export const VSL_TITLE =
  "Comment rentabiliser ton van (les erreurs qui m'ont coute des milliers d'euros)";

export const VSL_SHORT_TITLE = "Rentabilise ton van";

export const VSL_BULLETS = [
  "Comment acheter, amenager et rentabiliser un van en partant de zero",
  "La methode pour generer des revenus recurrents avec la location",
  "Les erreurs qui coutent des milliers d'euros (et comment les eviter)",
];

export function buildVslUrl(
  layer: 1 | 2 | 3 | 4,
  articleSlug: string
): string {
  return `${VSL_URL}?utm_source=blog&utm_medium=cta&utm_campaign=vsl&utm_content=layer${layer}&utm_term=${articleSlug}`;
}
