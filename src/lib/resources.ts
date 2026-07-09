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
    fileUrl: "/docs/business-vente-van-amenage.pdf",
    fileName: "vanzon-business-vente-van-amenage.pdf",
  },
  liste: {
    slug: "liste",
    title: "La liste materiel amenagement VASP",
    description:
      "Tout le materiel necessaire pour un amenagement aux normes VASP.",
    fileUrl: "/docs/liste-materiel-amenagement-vasp.pdf",
    fileName: "vanzon-liste-materiel-amenagement-vasp.pdf",
  },
};

export function getResource(slug: string | undefined): ResourceConfig | null {
  if (!slug) return null;
  return RESOURCES[slug] ?? null;
}
