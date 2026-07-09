/**
 * Generate lead magnet PDF: "Le business du van amenage" (guide gratuit communaute)
 * Usage: npx tsx scripts/generate-guide-van-amenage.ts
 * Output: public/docs/guide-business-van-amenage.pdf
 */

import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";

const OUTPUT_PATH = path.resolve(
  __dirname,
  "../public/docs/guide-business-van-amenage.pdf"
);

// ── Brand colors ──
const GOLD = "#B9945F";
const DARK = "#0F172A";
const GRAY = "#64748B";

const CTA_URL =
  "vanzonexplorer.com/van-business-academy/presentation?utm_source=guide-pdf&utm_medium=community&utm_campaign=guide_van";

interface Section {
  title: string;
  intro?: string;
  bullets?: string[];
  keyNumbers?: { label: string; value: string }[];
  quote?: string;
}

const SECTIONS: Section[] = [
  {
    title: "Un van amenage, c'est un actif — pas juste un road trip",
    intro:
      "La plupart des gens voient un van amenage comme un projet de voyage. C'est aussi — et surtout — un actif qui peut generer des revenus recurrents ET prendre de la valeur a la revente si tu le montes bien. Pas besoin d'etre bricoleur, pas besoin d'un gros capital de depart.",
    bullets: [
      "Un van bien achete + bien amenage se rentabilise en 2 a 3 ans de location",
      "Tu n'as besoin d'aucune competence en bricolage pour commencer",
      "Le cycle complet : acheter → amenager → louer → revendre → recommencer",
      "On l'applique depuis 4 ans sur notre propre flotte (Yoni + Xalbat)",
    ],
  },
  {
    title: "Partie 1 — Acheter le bon van",
    intro:
      "L'achat est l'etape ou la majorite des projets partent mal. Un mauvais choix de vehicule plombe tout le reste (budget travaux, fiabilite, revente).",
    bullets: [
      "Renault Trafic 3 (apres 2014) = meilleur rapport qualite/prix pour l'amenagement",
      "Budget vehicule max recommande : 10 000 EUR, kilometrage max : 200 000 km",
      "Les moteurs Renault tiennent jusqu'a 500 000 km s'ils sont bien entretenus",
      "L2H1 pour le confort, L1H1 pour la rentabilite pure",
      "Rouille perforante = NO GO absolu, on ne negocie pas, on repart",
      "Demande toujours l'usage precedent du vehicule : pro (usure) vs perso (mieux entretenu)",
      "Negociation possible : 5 a 15% du prix affiche",
    ],
    keyNumbers: [
      { label: "Budget vehicule max", value: "10 000 EUR" },
      { label: "Kilometrage max", value: "200 000 km" },
      { label: "Negociation moyenne", value: "5-15%" },
    ],
  },
  {
    title: "Partie 2 — Amenager sans se ruiner",
    intro:
      "L'erreur classique : trop de rangement, pas assez d'espace de vie. La deuxieme erreur classique : sous-estimer le budget parce qu'on compare aux prix Leroy Merlin au lieu des fournisseurs pro.",
    bullets: [
      "Budget realiste pour un amenagement complet : environ 5 000 a 5 500 EUR",
      "Compte 2 a 3 mois de travaux a temps plein, 3 a 6 mois en parallele d'un travail",
      "Contreplaque peuplier 15mm pour les meubles, OSB3 pour le sol",
      "Un fournisseur pro (type Dispano) coute nettement moins cher que la grande distribution",
      "Isolation, structure, murs, sol, meubles : toujours dans cet ordre",
      "VASP ou non-VASP : le VASP (homologation camping-car) coute plus cher et prend plus de temps, mais ajoute 5 000 EUR+ a la revente. Pour louer simplement, le non-VASP suffit dans 90% des cas.",
    ],
    keyNumbers: [
      { label: "Budget amenagement", value: "~5 000-5 500 EUR" },
      { label: "Temps travaux (plein temps)", value: "2-3 mois" },
      { label: "Plus-value VASP a la revente", value: "+5 000 EUR" },
    ],
  },
  {
    title: "Partie 3 — Louer et generer des revenus",
    intro:
      "C'est la partie que presque personne ne fait correctement, alors que c'est elle qui transforme le van d'une depense en un actif rentable.",
    bullets: [
      "Yescapa et Wikicampers gerent le paiement, l'assurance et les contrats a ta place",
      "Prix indicatifs : 65 EUR/nuit basse saison, 75 EUR moyenne saison, 90-95 EUR haute saison",
      "Duree minimum 2 jours, forfait ~200 km/jour, caution 1 500 a 2 000 EUR",
      "L'astuce caution : previens que le van rendu propre = caution integralement restituee — les locataires rendent presque toujours propre",
      "95% des locataires sont respectueux. Sur 2 ans de location : un rétroviseur raye a 15 EUR, rien de plus",
      "Sous 8 200 EUR/an de revenus locatifs, tu restes en declaration particulier (pas besoin de micro-entreprise tout de suite)",
    ],
    keyNumbers: [
      { label: "Commission Yescapa", value: "16%" },
      { label: "Revenu annuel par van (optimise)", value: "5 000-9 000 EUR" },
      { label: "Seuil micro-BIC", value: "8 200 EUR/an" },
    ],
    quote:
      "\"J'ai achete un utilitaire a 9 000 EUR, je l'ai amenage moi-meme pour 5 000 EUR, et en 8 mois de location il m'a rapporte plus de 5 500 EUR nets.\"",
  },
  {
    title: "Partie 4 — Revendre avec plus-value",
    intro:
      "Le troisieme pilier, celui que tout le monde oublie : le van n'est pas une depense qui se devalue comme une voiture classique s'il est bien entretenu et correctement documente.",
    bullets: [
      "Un van amenage et entretenu se revend generalement au-dessus du prix d'achat + travaux",
      "L'homologation VASP ajoute 5 000 EUR+ a la valeur de revente",
      "Garder toutes les factures d'entretien et les photos des travaux augmente la confiance acheteur",
      "Le capital recupere a la revente peut financer le van suivant : c'est le cycle vertueux",
    ],
  },
  {
    title: "3 erreurs qui coutent le plus cher",
    bullets: [
      "Acheter un vehicule sur un coup de coeur sans verification mecanique complete",
      "Construire les meubles sans avoir verifie la hauteur exacte du plafond a chaque etape",
      "Se lancer dans le VASP sans avoir determine si on en a reellement besoin (gaz fixe ? modification de structure ?) — sinon, budget et delais gaspilles pour rien",
    ],
  },
  {
    title: "Les chiffres a retenir",
    keyNumbers: [
      { label: "Budget total realiste (vehicule + amenagement)", value: "~14 000-15 000 EUR" },
      { label: "CA brut reel, 1 van, 8 mois", value: "5 575 EUR" },
      { label: "Benefice net, 1 van, 8 mois", value: "4 126 EUR" },
      { label: "Rentabilisation moyenne", value: "~2,5 ans" },
      { label: "4 vans en flotte", value: "~2 180 EUR/mois de revenu" },
    ],
  },
];

// ── PDF Generator ──

function drawCover(doc: PDFKit.PDFDocument) {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(DARK);

  doc
    .fillColor(GOLD)
    .fontSize(12)
    .text("GUIDE GRATUIT — VANZON EXPLORER", 50, 220, {
      width: doc.page.width - 100,
      align: "center",
    });

  doc
    .fillColor("#ffffff")
    .fontSize(30)
    .text("Le business du van amenage", 50, 250, {
      width: doc.page.width - 100,
      align: "center",
    });

  doc
    .fillColor("#ffffff")
    .opacity(0.75)
    .fontSize(14)
    .text(
      "Acheter, amenager, louer et revendre un van — la methode et les vrais chiffres",
      50,
      310,
      { width: doc.page.width - 100, align: "center" }
    );
  doc.opacity(1);

  doc
    .fillColor(GOLD)
    .fontSize(10)
    .text("vanzonexplorer.com", 50, doc.page.height - 60, {
      width: doc.page.width - 100,
      align: "center",
    });
}

function drawCTA(doc: PDFKit.PDFDocument) {
  doc.addPage();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(DARK);

  doc
    .fillColor(GOLD)
    .fontSize(12)
    .text("ET APRES ?", 50, 200, {
      width: doc.page.width - 100,
      align: "center",
    });

  doc
    .fillColor("#ffffff")
    .fontSize(22)
    .text(
      "Ce guide couvre les bases. Van Business Academy couvre tout le reste.",
      50,
      225,
      { width: doc.page.width - 100, align: "center" }
    );

  doc
    .fillColor("#ffffff")
    .opacity(0.8)
    .fontSize(11)
    .text(
      "11 modules, 120+ videos, l'homologation VASP pas a pas, le circuit electrique complet, les templates de budget, et un acces direct pour poser tes questions.",
      50,
      280,
      { width: doc.page.width - 100, align: "center", lineGap: 4 }
    );
  doc.opacity(1);

  doc
    .fillColor(GOLD)
    .fontSize(13)
    .text(CTA_URL, 50, 360, {
      width: doc.page.width - 100,
      align: "center",
    });

  doc
    .fillColor("#ffffff")
    .opacity(0.5)
    .fontSize(9)
    .text(
      "J'ai commence sans savoir planter un clou. Si j'ai pu le faire, toi aussi. — Jules, Vanzon Explorer",
      50,
      doc.page.height - 80,
      { width: doc.page.width - 100, align: "center" }
    );
  doc.opacity(1);
}

function generatePDF() {
  const doc = new PDFDocument({
    size: "A4",
    bufferPages: true,
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: "Le business du van amenage — Guide gratuit Vanzon Explorer",
      Author: "Vanzon Explorer",
    },
  });

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  const stream = fs.createWriteStream(OUTPUT_PATH);
  doc.pipe(stream);

  const pageWidth = doc.page.width - 100;
  const MAX_Y = 760;

  drawCover(doc);

  for (const section of SECTIONS) {
    doc.addPage();
    let y = 50;

    doc.rect(0, 0, doc.page.width, 70).fill(DARK);
    doc
      .fontSize(16)
      .fillColor("#ffffff")
      .text(section.title, 50, 24, { width: pageWidth });

    y = 95;

    if (section.intro) {
      doc.fillColor(DARK).fontSize(10).text(section.intro, 50, y, {
        width: pageWidth,
        lineGap: 3,
      });
      y = doc.y + 16;
    }

    if (section.bullets && section.bullets.length > 0) {
      for (const point of section.bullets) {
        if (y > MAX_Y) {
          doc.addPage();
          y = 50;
        }
        doc.fillColor(GOLD).fontSize(9).text(">", 50, y);
        doc.fillColor(DARK).fontSize(9).text(point, 64, y, {
          width: pageWidth - 14,
          lineGap: 2,
        });
        y = doc.y + 7;
      }
      y += 6;
    }

    if (section.keyNumbers && section.keyNumbers.length > 0) {
      if (y > MAX_Y) {
        doc.addPage();
        y = 50;
      }
      doc.fillColor(GOLD).fontSize(11).text("Chiffres cles", 50, y);
      y += 18;
      for (const num of section.keyNumbers) {
        if (y > MAX_Y) {
          doc.addPage();
          y = 50;
        }
        doc.fillColor(GOLD).fontSize(10).text(num.value, 50, y, { continued: true });
        doc.fillColor(GRAY).fontSize(9).text(`  ${num.label}`, { lineGap: 2 });
        y = doc.y + 5;
      }
      y += 6;
    }

    if (section.quote) {
      if (y > MAX_Y) {
        doc.addPage();
        y = 50;
      }
      doc.fillColor(GRAY).fontSize(9).text(section.quote, 50, y, {
        width: pageWidth,
        italic: true,
        lineGap: 3,
      });
    }

    doc
      .fillColor(GRAY)
      .opacity(0.5)
      .fontSize(8)
      .text("vanzonexplorer.com — Le business du van amenage", 50, doc.page.height - 40, {
        width: pageWidth,
        align: "center",
        lineBreak: false,
      });
    doc.opacity(1);
  }

  drawCTA(doc);

  doc.end();

  return new Promise<void>((resolve) => {
    stream.on("finish", () => {
      const size = fs.statSync(OUTPUT_PATH).size;
      console.log(`✅ Guide genere — ${(size / 1024).toFixed(0)} KB`);
      console.log(`   ${OUTPUT_PATH}`);
      resolve();
    });
  });
}

generatePDF().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
