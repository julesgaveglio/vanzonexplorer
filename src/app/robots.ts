import type { MetadataRoute } from "next";

const BASE_URL = "https://vanzonexplorer.com";

// Chemins privés — jamais crawlés, ni par Google ni par les IA
const PRIVATE_PATHS = [
  "/espace-membre/",
  "/user/",
  "/sign-in/",
  "/sign-up/",
  "/studio/",
  "/admin/",
  "/pixel-agents/",
  "/van-business-academy/",
  "/ads/",
  "/ads-login",
  "/sigma/",
  "/sigma-login",
];

// Crawlers des moteurs de recherche IA — autorisés explicitement (stratégie GEO).
// Recherche/citations : OAI-SearchBot (ChatGPT search), Claude-SearchBot,
// PerplexityBot. Fetch à la demande : ChatGPT-User, Claude-User, Perplexity-User.
// Entraînement : GPTBot, ClaudeBot, Google-Extended, Applebot-Extended,
// meta-externalagent — autorisés aussi : être dans les corpus d'entraînement
// augmente les recommandations spontanées des LLM.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "meta-externalagent",
  "Amazonbot",
  "Bytespider",
  "CCBot",
  "cohere-ai",
  "MistralAI-User",
  "DuckAssistBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
