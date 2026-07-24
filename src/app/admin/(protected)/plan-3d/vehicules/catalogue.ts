/**
 * Catalogue des carrosseries de fourgons pour la librairie 3D.
 *
 * Les candidats sont des modèles relevés sur l'API Sketchfab en juillet 2026
 * (recherche `downloadable=true`) : nom, uid, licence et nombre de faces sont
 * ceux renvoyés par l'API. Aucun n'a été téléchargé ni vérifié
 * dimensionnellement — voir `ACCURACY` plus bas.
 *
 * Les cotes intérieures, elles, viennent des fiches constructeur : ce sont
 * elles qui font foi, le modèle 3D ne sert qu'à visualiser la forme.
 */

export type License = "CC-BY" | "CC-BY-NC" | "CC-BY-NC-SA";

export interface CandidateModel {
  title: string;
  /** Identifiant Sketchfab — page : https://sketchfab.com/3d-models/<uid> */
  uid: string;
  license: License;
  faces: number;
  note?: string;
}

export interface InteriorSpec {
  variant: string;
  /** Longueur utile au plancher (mm) */
  length: number;
  /** Largeur maxi (mm) */
  width: number;
  /** Largeur entre passages de roue (mm) */
  betweenArches: number;
  /** Hauteur utile (mm) */
  height: number;
  /** Hauteur de seuil (mm) */
  sill?: number;
}

export interface Vehicle {
  slug: string;
  brand: string;
  model: string;
  /** Modèles jumeaux : même carrosserie, autre badge. */
  twins?: string;
  variants: string;
  interior?: InteriorSpec[];
  interiorSource?: string;
  candidates: CandidateModel[];
  comment?: string;
}

export const LICENSE_LABELS: Record<License, { short: string; usage: string; ok: boolean }> = {
  "CC-BY": {
    short: "CC BY",
    usage: "Usage commercial autorisé, crédit auteur obligatoire",
    ok: true,
  },
  "CC-BY-NC": {
    short: "CC BY-NC",
    usage: "Non commercial — exclu d'une formation payante",
    ok: false,
  },
  "CC-BY-NC-SA": {
    short: "CC BY-NC-SA",
    usage: "Non commercial + partage à l'identique — exclu",
    ok: false,
  },
};

export const VEHICLES: Vehicle[] = [
  {
    slug: "renault-trafic",
    brand: "Renault",
    model: "Trafic",
    twins: "Nissan NV300 · Opel/Vauxhall Vivaro · Fiat Talento",
    variants: "L1H1 · L2H1 · L1H2 · L2H2",
    interior: [
      { variant: "L1H1", length: 2537, width: 1662, betweenArches: 1268, height: 1387, sill: 552 },
      { variant: "L2H1", length: 2937, width: 1662, betweenArches: 1268, height: 1387, sill: 552 },
      { variant: "L1H2", length: 2537, width: 1662, betweenArches: 1268, height: 1898, sill: 552 },
      { variant: "L2H2", length: 2937, width: 1662, betweenArches: 1268, height: 1898, sill: 552 },
    ],
    interiorSource: "Fiches techniques Renault / bases de cotes fourgons",
    candidates: [
      {
        title: "Renault Trafic MK2 2001-2014",
        uid: "12481b78d63743d4803d63c9ec640ae6",
        license: "CC-BY",
        faces: 204878,
        note: "Génération précédente (X83) — carrosserie différente de l'actuelle",
      },
      {
        title: "Renault Trafic",
        uid: "db292fc2d0c14d9ba2468e20d55b99f8",
        license: "CC-BY",
        faces: 1236918,
        note: "Généré par IA (Meshy) — silhouette approximative, cotes non fiables",
      },
    ],
    comment:
      "Aucun modèle libre de la génération actuelle (X82, depuis 2014) trouvé. C'est le véhicule le plus important pour nous et le moins bien servi.",
  },
  {
    slug: "fiat-ducato",
    brand: "Fiat",
    model: "Ducato",
    twins: "Peugeot Boxer · Citroën Jumper · Opel Movano (depuis 2021)",
    variants: "L1H1 → L4H3",
    candidates: [
      {
        title: "2017 Fiat Ducato Panel Van",
        uid: "5ac7d1be7d2341809cec0d798a33dc05",
        license: "CC-BY",
        faces: 998850,
        note: "Fourgon tôlé, génération actuelle — le meilleur candidat de la liste",
      },
      {
        title: "Ducato L4H2 Model",
        uid: "93999aa5e0474681aa9ff1e10e742a4c",
        license: "CC-BY",
        faces: 177076,
        note: "Variante annoncée explicitement, maillage léger",
      },
      {
        title: "2020 Peugeot Boxer 435 L4H2",
        uid: "5f342921b4ff4c929fe17fb1f6b72a8c",
        license: "CC-BY",
        faces: 887864,
        note: "Même carrosserie que le Ducato",
      },
      {
        title: "FIAT DUCATO VAN 2023",
        uid: "719410abfa414f399600a07ec2a3b2f4",
        license: "CC-BY",
        faces: 2125305,
        note: "Très lourd — à alléger avant import",
      },
      {
        title: "3D Scanned Fiat Ducato Benimar Camper",
        uid: "873cd8e9504b48b7b8e1be30327cd4f7",
        license: "CC-BY",
        faces: 92320,
        note: "Photogrammétrie d'un camping-car fini — utile en référence, pas en coque",
      },
    ],
  },
  {
    slug: "citroen-jumpy",
    brand: "Citroën",
    model: "Jumpy",
    twins: "Peugeot Expert · Toyota Proace · Opel Vivaro (depuis 2019)",
    variants: "XS · M · XL (H1)",
    candidates: [],
    comment:
      "Rien de téléchargeable sur Sketchfab. À chercher sur GrabCAD ou auprès d'un aménageur ; sinon partir des cotes constructeur.",
  },
  {
    slug: "mercedes-sprinter",
    brand: "Mercedes",
    model: "Sprinter",
    variants: "L1 → L4, H1 → H3",
    candidates: [
      {
        title: "2019 Mercedes-Benz Sprinter",
        uid: "5788a290ddb5483fbbd5831aeef829a1",
        license: "CC-BY",
        faces: 153487,
      },
      {
        title: "Mercedes Sprinter 2021",
        uid: "15562e65c77a4d6494ea9abca8827d47",
        license: "CC-BY",
        faces: 113694,
      },
      {
        title: "Mercedes Sprinter",
        uid: "b8ed493c5f7d4a90a9db8ebe10c43fe5",
        license: "CC-BY-NC-SA",
        faces: 1626870,
        note: "Licence non commerciale — à ne pas utiliser dans la formation",
      },
    ],
    comment:
      "Seule plateforme avec des scans 3D professionnels payants (FarOutRide / Rapid3D), précis au millimètre.",
  },
];

/** Aménagements complets, utiles comme références d'agencement. */
export const LAYOUT_REFERENCES: CandidateModel[] = [
  { title: "Van Conversion Model 1 (Ducato L5H2)", uid: "d7e39aa675ae426cb6eeaea7fb7d2a70", license: "CC-BY", faces: 0 },
  { title: "Van Conversion Model 2", uid: "d7f52625c541479d8aa0078ea37f6610", license: "CC-BY", faces: 22161 },
  { title: "Van Conversion Model 3", uid: "8023299757e14f33b97cbde418808fe4", license: "CC-BY", faces: 32235 },
  { title: "Van Conversion Model 4", uid: "3a5fe0cdf0bb43cc85acb258c21c4c40", license: "CC-BY", faces: 175068 },
  { title: "Van Conversion Model 5", uid: "1cfa606ce71947bbb5af322b43b353bd", license: "CC-BY", faces: 173564 },
];
