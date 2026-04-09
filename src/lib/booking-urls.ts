/**
 * Parse booking URLs from DB field.
 * Handles both legacy single URL strings and JSON arrays.
 */
export function parseBookingUrls(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    // Not JSON — legacy single URL
  }
  return [raw];
}

/**
 * Serialize an array of URLs for DB storage.
 */
export function serializeBookingUrls(urls: string[]): string | null {
  const filtered = urls.map((u) => u.trim()).filter(Boolean);
  if (filtered.length === 0) return null;
  if (filtered.length === 1) return filtered[0];
  return JSON.stringify(filtered);
}

/**
 * Detect platform name from a URL.
 */
export function detectPlatform(url: string): string {
  if (url.includes("yescapa")) return "Yescapa";
  if (url.includes("wikicampers")) return "Wikicampers";
  if (url.includes("wa.me")) return "WhatsApp";
  if (url.includes("leboncoin")) return "Leboncoin";
  if (url.includes("naturacamper")) return "NaturaCamper";
  if (url.includes("goboony")) return "Goboony";
  if (url.includes("airbnb")) return "Airbnb";
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "la plateforme";
  }
}
