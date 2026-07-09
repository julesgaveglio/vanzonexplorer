export interface ResourceConfig {
  slug: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
}

export const RESOURCES: Record<string, ResourceConfig> = {
  guide: {
    slug: "guide",
    title: "Le business du van amenage",
    description:
      "Acheter, amenager, louer et revendre un van amenage — la methode et les vrais chiffres.",
    fileUrl: "/docs/guide-business-van-amenage.pdf",
    fileName: "vanzon-guide-business-van-amenage.pdf",
  },
  liste: {
    slug: "liste",
    title: "La liste",
    description: "Ressource a venir.",
    fileUrl: "/docs/guide-business-van-amenage.pdf",
    fileName: "vanzon-liste.pdf",
  },
};

export function getResource(slug: string | undefined): ResourceConfig | null {
  if (!slug) return null;
  return RESOURCES[slug] ?? null;
}
