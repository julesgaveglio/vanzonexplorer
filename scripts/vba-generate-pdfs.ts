/**
 * VBA -Generate recap PDFs for each module
 * Usage: npx tsx scripts/vba-generate-pdfs.ts
 *
 * Generates branded PDF recaps with:
 * - Module summary & key takeaways
 * - Checklist of actions
 * - Pro tips enriching the video content
 * - Links to tools mentioned
 */

import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";

const OUTPUT_DIR = path.resolve(__dirname, "../public/vba/pdf");

// ── Brand colors ──
const GOLD = "#B9945F";
const DARK = "#0F172A";
const GRAY = "#64748B";
const LIGHT_BG = "#F8F6F1";

// ── PDF content per module ──
interface ModulePDF {
  moduleNum: number;
  title: string;
  emoji: string;
  summary: string;
  keyTakeaways: string[];
  checklist: string[];
  proTips: string[];
  tools?: { name: string; url: string }[];
  keyNumbers?: { label: string; value: string }[];
}

const MODULES: ModulePDF[] = [
  {
    moduleNum: 1,
    title: "Presentation",
    emoji: "👋",
    summary:
      "Ce module pose les bases du projet. Tu decouvres l'histoire de Vanzon, les benefices caches d'avoir un van amenage, et surtout tu choisis TON type de projet : VASP (homologue camping-car) ou non-VASP (amenagement simple). Ce choix determine tout le reste de ta formation.",
    keyTakeaways: [
      "Un van amenage est un ACTIF : il genere des revenus ET prend de la valeur",
      "Tu n'as besoin d'aucune competence en bricolage pour commencer",
      "Projet VASP = rentabilite max + plus-value revente, mais plus de travail",
      "Projet non-VASP = liberte d'amenagement, moins de contraintes, ideal pour debuter",
      "L'outil Airtable te servira tout au long du projet pour gerer ton budget et tes achats",
    ],
    checklist: [
      "Definir ton objectif : location pure, usage perso + location, ou achat-revente",
      "Choisir ton parcours : VASP (modules 1-10) ou non-VASP (skip modules 4, 7, 8, 9)",
      "Dupliquer le tableau Airtable depuis le lien fourni dans la video",
      "Creer ton espace de travail Airtable",
    ],
    proTips: [
      "Si tu hesites entre VASP et non-VASP, commence par non-VASP. Tu pourras toujours homologuer plus tard.",
      "Le VASP se justifie surtout si ton objectif est l'achat-revente avec plus-value maximale.",
      "Garde Airtable ouvert en permanence pendant tout le projet -c'est ton tableau de bord central.",
    ],
  },
  {
    moduleNum: 2,
    title: "Sourcing & Achat du Van",
    emoji: "🔍",
    summary:
      "Comment trouver le bon utilitaire, au bon prix, sans se faire avoir. De la selection du modele a la negociation finale en passant par toutes les verifications mecaniques sur place.",
    keyTakeaways: [
      "Renault Trafic 3 (apres 2014) = meilleur rapport qualite/prix pour l'amenagement",
      "Budget max vehicule : 10 000 EUR, kilometrage max : 200 000 km",
      "Moteurs Renault : durables jusqu'a 500 000 km si bien entretenus",
      "L2H1 pour le confort, L1H1 pour la rentabilite pure",
      "Les parois droites du Trafic facilitent enormement l'amenagement",
      "Negociation possible : 5 a 15% du prix affiche",
    ],
    checklist: [
      "Creer une alerte LeBonCoin + LaCentrale avec les bons filtres",
      "Preparer ton message de contact (template ChatGPT fourni)",
      "Imprimer la checklist mecanique pour le RDV sur place",
      "Tester : pneus (technique piece 2 EUR), embrayage (3e + frein + lacher)",
      "Verifier : controle technique < 6 mois, factures d'entretien, carte grise",
      "Negocier en chiffrant les reparations necessaires",
    ],
    proTips: [
      "Demande toujours l'usage du vehicule : pro (charges lourdes = usure) vs perso (meilleur entretien).",
      "Rouille perforante = NO GO absolu. Ne negocie pas, pars.",
      "Si le vehicule est impeccable, dis : 'Je suis pas presse, c'est mon premier. Si geste sur le prix, je repars avec.'",
      "Sauvegarde la recherche sur l'app LeBonCoin pour recevoir les notifications en temps reel.",
    ],
    keyNumbers: [
      { label: "Budget vehicule max", value: "10 000 EUR" },
      { label: "Kilometrage max", value: "200 000 km" },
      { label: "Negociation moyenne", value: "5-15%" },
      { label: "Modele recommande", value: "Renault Trafic 3 L2H1" },
    ],
  },
  {
    moduleNum: 3,
    title: "Conception & Budget",
    emoji: "📐",
    summary:
      "Preparer son amenagement intelligemment AVANT de commencer les travaux. Tu apprends a eviter les erreurs classiques, choisir les bons materiaux, utiliser Airtable pour gerer ton budget au centime pres, et planifier ton temps de travail.",
    keyTakeaways: [
      "Erreur #1 : trop de rangement, pas assez d'espace de vie",
      "La cuisine coulissante arriere est la solution la plus pratique",
      "Budget total amenagement : environ 5 430 EUR (chiffre reel Vanzon)",
      "Temps de travaux : 2-3 mois temps plein, 3-6 mois avec un travail a cote",
      "Contreplaque Peuplier 15mm pour les meubles, OSB3 pour le sol",
      "Fournisseur Dispano = bien moins cher que Leroy Merlin",
    ],
    checklist: [
      "Trouver tes inspirations (Pinterest, YouTube, Instagram #vanlife)",
      "Dessiner un plan d'amenagement (meme basique sur papier)",
      "Dupliquer le tableau Airtable budget et le personnaliser",
      "Commander les outils Ryobi (ou alternatives Lidl/Action)",
      "Commander le bois chez Dispano (demander un devis)",
      "Prevoir les erreurs listees dans le module et les eviter",
    ],
    proTips: [
      "Boxio = la marque recommandee pour la cuisine (rechaud gaz + lavabo + toilettes portatives). Code promo : 20ZONES.",
      "Vernir le contreplaque des 2 cotes -il est sensible a l'eau.",
      "Ne construis JAMAIS de meubles sans verifier la hauteur du plafond d'abord.",
      "Appelle Dispano plutot que de commander en ligne -les prix varient entre agences.",
    ],
    tools: [
      { name: "Airtable (budget & suivi)", url: "https://airtable.com" },
      { name: "Boxio (cuisine)", url: "https://boxio.de/fr" },
      { name: "Ryobi (outils)", url: "https://www.ryobitools.eu/fr" },
      { name: "Dispano (bois)", url: "https://www.dispano.fr" },
    ],
    keyNumbers: [
      { label: "Budget amenagement total", value: "5 430,72 EUR" },
      { label: "Kit outils Ryobi", value: "~508 EUR" },
      { label: "Bois necessaire", value: "~20m2 + 9 tasseaux" },
      { label: "Temps travaux (plein temps)", value: "2-3 mois" },
    ],
  },
  {
    moduleNum: 4,
    title: "Conception & Budget VASP L1H1",
    emoji: "📋",
    summary:
      "Specifique au projet VASP en L1H1 (petit fourgon). Ce module presente l'amenagement complet aux normes VASP avec cuisine fixe, reservoirs d'eau, et toutes les specifications necessaires pour l'homologation. Inclut le tableau Airtable dedie au budget VASP.",
    keyTakeaways: [
      "Le L1H1 VASP est le meilleur ratio rentabilite pour la location",
      "Cuisine fixe obligatoire pour le VASP : plaque de cuisson + robinet fixes",
      "Reservoirs d'eau propre et eau usee obligatoires",
      "Chaque element doit etre aux normes pour passer l'homologation",
      "Le budget VASP est plus eleve mais la revente compense largement",
    ],
    checklist: [
      "Etudier le plan d'amenagement VASP presente dans la video",
      "Dupliquer le tableau Airtable specifique VASP L1H1",
      "Lister les equipements obligatoires (cuisine fixe, eau, aeration)",
      "Prevoir le budget supplementaire VASP (600-1 500 EUR homologation)",
    ],
    proTips: [
      "Prends des photos a CHAQUE etape des travaux -tu en auras besoin pour le dossier VASP.",
      "Achete uniquement des equipements avec des certificats de conformite -ca simplifie le dossier.",
      "Le L1H1 est moins intimidant pour les locataires qu'un grand fourgon -avantage commercial.",
    ],
  },
  {
    moduleNum: 5,
    title: "Les Travaux",
    emoji: "🔧",
    summary:
      "Le guide etape par etape pour construire l'amenagement de ton van. Du nettoyage initial a la construction des meubles, chaque etape est detaillee avec les materiaux exacts et les techniques a utiliser.",
    keyTakeaways: [
      "Ordre des travaux : nettoyage → fenetre → isolation → structure → murs → sol → meubles",
      "Isolation : ArmaFlex 19mm + feutrine collee a la colle neoprene",
      "Structure : 9 tasseaux sapin 2m40, colles SikaFlex + visses autoforeuse 50mm",
      "ERREUR vecue : ne jamais juste coller les tasseaux, toujours visser en plus",
      "Sol : OSB3 comme base, tapis moquette par-dessus",
      "Meubles : technique tasseaux fins interieurs + vis 25mm pour des arretes propres",
    ],
    checklist: [
      "Nettoyer completement l'interieur (enlever murs, sol, paroi separation)",
      "Garder les anciens murs pour les recycler",
      "Poser la fenetre (gabarit pre-sculpte dans le Trafic)",
      "Isoler avec ArmaFlex 19mm (commencer par le plafond)",
      "Construire la structure en tasseaux (coller ET visser)",
      "Poncer et vernir les murs (2 couches polyurethane)",
      "Poser le sol OSB3 + tapis moquette",
      "Construire les meubles (pre-percer les tasseaux !)",
    ],
    proTips: [
      "Utilise l'ancien sol comme patron pour decouper le nouveau -gain de temps enorme.",
      "Framéto anti-rouille + primaire d'accroche sur TOUTES les decoupes dans la carrosserie.",
      "Pense en 4D quand tu construis tes meubles : verifie TOUJOURS la hauteur plafond avant.",
      "Nettoyeur 450W max -au-dela tu risques de faire sauter le circuit electrique du van.",
    ],
  },
  {
    moduleNum: 6,
    title: "Electricite",
    emoji: "⚡",
    summary:
      "Comprendre et installer le circuit electrique de ton van sans connaissance prealable. Des bases (Volt, Ampere, Watt) jusqu'au circuit complet avec batterie auxiliaire, panneau solaire et onduleur.",
    keyTakeaways: [
      "Batterie auxiliaire sous les sieges avant = coeur du systeme",
      "2 sources de recharge : batterie moteur (chargeur DC-DC) + panneau solaire 100W",
      "Le chargeur DC-DC charge uniquement quand le moteur tourne (securite anti-panne)",
      "50Ah suffit largement pour un usage standard (glaciere + LED + ordi + telephones)",
      "Analogie pour comprendre : Volt = pression, Ampere = debit, Watt = force du jet",
      "Cosses + pince a sertir Lidl 10 EUR = tout ce qu'il faut pour les raccords",
    ],
    checklist: [
      "Calculer ta consommation quotidienne (W/jour)",
      "Choisir ta batterie (50Ah minimum, 100Ah recommande)",
      "Commander le chargeur DC-DC + regulateur solaire",
      "Commander le panneau solaire 100W",
      "Prevoir fusibles avec 25% de marge sur l'amperage",
      "Suivre le schema de cablage fourni dans Airtable",
    ],
    proTips: [
      "Utilise ChatGPT pour calculer les sections de cable exactes (longueur + amperage + voltage).",
      "Le regulateur solaire a 2 prises USB integrees -branche-les directement dessus pour les telephones.",
      "Mets un interrupteur ON/OFF entre la batterie et les multiprises pour preserver la batterie quand le van est stocke.",
    ],
    keyNumbers: [
      { label: "Batterie minimum", value: "50Ah (640Wh)" },
      { label: "Panneau solaire", value: "100W" },
      { label: "Recharge journaliere (2h route + 6h soleil)", value: "1 284Wh" },
      { label: "Pince a sertir Lidl", value: "10 EUR" },
    ],
  },
  {
    moduleNum: 7,
    title: "Homologation VASP",
    emoji: "✅",
    summary:
      "Tout comprendre sur l'homologation VASP : quand c'est obligatoire, quand ca ne l'est pas, le processus complet, les avantages/inconvenients, et les couts administratifs. Ce module te permet de decider en connaissance de cause.",
    keyTakeaways: [
      "VASP = Vehicule Automoteur Specialement Amenage (carte grise camping-car)",
      "Pas obligatoire si amenagement simple, sans gaz fixe, sans modification de structure",
      "Obligatoire si : gaz fixe, modification de structure, ou conformite camping-car complete",
      "Les plateformes de location acceptent les vans non-VASP",
      "Un van VASP se revend 5 000 EUR+ de plus qu'un non-VASP",
      "Cout homologation : 600 a 1 500 EUR selon les regions",
    ],
    checklist: [
      "Determiner si tu as BESOIN du VASP (gaz fixe ? modification structure ?)",
      "Si VASP : suivre les modules 8 et 9 attentivement",
      "Contacter la DREAL de ta region pour connaitre les exigences locales",
      "Preparer ton budget homologation (600-1 500 EUR)",
    ],
    proTips: [
      "Utilise Perplexity AI pour rechercher les reglementations specifiques a ta region.",
      "Si tu veux faire de l'achat-revente, le VASP est quasi obligatoire pour maximiser la plus-value.",
      "Pour la location pure, le non-VASP suffit dans 90% des cas.",
    ],
  },
  {
    moduleNum: 8,
    title: "Les Normes VASP",
    emoji: "📏",
    summary:
      "Toutes les normes techniques a respecter pour obtenir l'homologation VASP. Chaque norme est detaillee : amenagement, electricite, gaz, eau, aeration, pesee, marche-pied, issue de secours, etiquettes et objets obligatoires.",
    keyTakeaways: [
      "Issue de secours obligatoire (fenetre qui s'ouvre suffisamment)",
      "Pesee du vehicule a faire AVANT de deposer le dossier",
      "Etiquettes obligatoires : poids, gaz, eau, electricite",
      "Circuit d'eau : eau propre + eau usee, reservoirs accessibles",
      "Gaz : normes strictes, installation par un professionnel recommandee",
      "Electricite : normes specifiques differentes du circuit 12V standard",
      "Aeration : ventilation haute et basse obligatoires",
      "Marche-pied : obligatoire si la hauteur de seuil depasse un certain niveau",
    ],
    checklist: [
      "Issue de secours : verifier les dimensions reglementaires",
      "Faire peser le vehicule amenage sur une balance certifiee",
      "Commander et poser les etiquettes obligatoires",
      "Installer les aerations haute et basse",
      "Verifier la conformite du circuit d'eau (propre + usee)",
      "Faire verifier l'installation gaz si applicable",
      "Installer le marche-pied si necessaire",
      "Lister les objets obligatoires (extincteur, triangle, gilet, etc.)",
    ],
    proTips: [
      "Achete TOUS les equipements avec certificats de conformite des le depart -ca t'evitera de tout racheter.",
      "Fais la pesee AVANT le depot de dossier, pas apres. Si tu es trop lourd, tu devras alleguer.",
      "Prends des photos de CHAQUE norme respectee -elles iront dans le dossier DREAL.",
    ],
  },
  {
    moduleNum: 9,
    title: "Remplir le Dossier VASP",
    emoji: "📄",
    summary:
      "Guide pratique pour constituer et deposer le dossier VASP aupres de la DREAL. Du certificat de conformite aux photos obligatoires en passant par l'attestation de travaux.",
    keyTakeaways: [
      "Le certificat de conformite barre rouge est le document central du dossier",
      "La demande de reception se fait aupres de la DREAL de ta region",
      "Les photos du van doivent montrer chaque element aux normes",
      "L'attestation de travaux documente toutes les modifications faites",
    ],
    checklist: [
      "Obtenir le certificat de conformite barre rouge du vehicule",
      "Remplir la demande de reception DREAL",
      "Prendre les photos obligatoires (interieur, exterieur, equipements)",
      "Rediger l'attestation de travaux avec la liste des modifications",
      "Rassembler tous les certificats de conformite des equipements",
      "Deposer le dossier complet aupres de la DREAL",
    ],
    proTips: [
      "Fais une copie numerique de TOUT le dossier avant de le deposer.",
      "Appelle la DREAL avant de deposer pour verifier qu'il ne manque rien -ca evite les allers-retours.",
      "Les delais varient de 2 semaines a 2 mois selon les regions.",
    ],
  },
  {
    moduleNum: 10,
    title: "Business de Location",
    emoji: "💰",
    summary:
      "Le module le plus complet : comment transformer ton van en source de revenus recurrents. Business model, etude de marche, pricing, gestion client, automatisation, fiscalite -tout est couvert avec les vrais chiffres de Vanzon.",
    keyTakeaways: [
      "3 piliers du modele : revenus locatifs + plus-value revente + capital reutilisable",
      "Plateformes : Yescapa (principale) + Wikicampers, elles gerent paiements + assurance + contrats",
      "Chiffres reels : 5 575 EUR brut en 8 mois avec 1 seul van, 12 reservations",
      "95% des locataires sont respectueux, 100% avis 5 etoiles",
      "Rentabilisation d'un van (15 000 EUR) en environ 2,5 ans",
      "4 vans = environ 2 180 EUR/mois de revenu passif",
      "Fiscalite : < 8 200 EUR/an = declaration particulier, micro BIC, abattement 50%",
    ],
    checklist: [
      "Creer un compte sur Yescapa et/ou Wikicampers",
      "Publier ton annonce avec photos professionnelles",
      "Fixer tes prix : basse saison 60-65 EUR, moyenne 70 EUR, haute 90-95 EUR",
      "Configurer : duree minimum 2 jours, forfait 200 km/jour, caution 1 500-2 000 EUR",
      "Preparer les messages types (premier contact, J-3, jour J, retour)",
      "Creer une video YouTube de presentation du van",
      "Mettre en place le boitier de remise de cles pour l'automatisation",
      "Choisir ton regime fiscal (particulier vs micro-entreprise)",
    ],
    proTips: [
      "L'astuce caution : dis au locataire 'si le van est propre au retour, caution restituee integralement'. Ils rendent TOUJOURS propre.",
      "Bloque des dates pour toi aussi -le van est un actif mais aussi un vehicule de plaisir.",
      "La video YouTube de presentation du van peut remplacer la visite en personne.",
      "Ne commence PAS a > 8 200 EUR/an -reste en declaration particulier le plus longtemps possible.",
    ],
    tools: [
      { name: "Yescapa", url: "https://www.yescapa.com" },
      { name: "Wikicampers", url: "https://www.wikicampers.fr" },
    ],
    keyNumbers: [
      { label: "CA brut (8 mois, 1 van)", value: "5 575,78 EUR" },
      { label: "Benefice net", value: "4 125,79 EUR" },
      { label: "Commission Yescapa", value: "16%" },
      { label: "Seuil micro BIC", value: "8 200 EUR/an" },
      { label: "Objectif 4 vans", value: "~2 180 EUR/mois" },
      { label: "Rentabilisation", value: "~2,5 ans" },
    ],
  },
];

// ── PDF Generator ──

function generatePDF(mod: ModulePDF) {
  const doc = new PDFDocument({
    size: "A4",
    bufferPages: true,
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: `VBA -Module ${mod.moduleNum} : ${mod.title}`,
      Author: "Vanzon Explorer",
    },
  });

  const filePath = path.join(OUTPUT_DIR, `vba-module-${mod.moduleNum}-recap.pdf`);
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const pageWidth = doc.page.width - 100; // margins

  // ── Header bar ──
  doc.rect(0, 0, doc.page.width, 90).fill(DARK);
  doc.fontSize(11).fillColor("#ffffff").opacity(0.6)
    .text("VAN BUSINESS ACADEMY", 50, 25, { width: pageWidth });
  doc.fontSize(22).fillColor("#ffffff").opacity(1)
    .text(`Module ${mod.moduleNum} -${mod.title}`, 50, 48, { width: pageWidth });

  doc.moveDown(2);
  let y = 110;

  // ── Summary ──
  doc.fillColor(GOLD).fontSize(14).text("Resume du module", 50, y);
  y += 22;
  doc.fillColor(DARK).fontSize(10).text(mod.summary, 50, y, {
    width: pageWidth,
    lineGap: 4,
  });
  y = doc.y + 20;

  // ── Key Takeaways ──
  doc.fillColor(GOLD).fontSize(14).text("Points cles a retenir", 50, y);
  y += 22;
  for (const point of mod.keyTakeaways) {
    if (y > 720) { doc.addPage(); y = 50; }
    doc.fillColor(GOLD).fontSize(10).text(">", 50, y);
    doc.fillColor(DARK).fontSize(10).text(point, 65, y, {
      width: pageWidth - 15,
      lineGap: 3,
    });
    y = doc.y + 8;
  }
  y += 10;

  // ── Key Numbers (if any) ──
  if (mod.keyNumbers && mod.keyNumbers.length > 0) {
    if (y > 650) { doc.addPage(); y = 50; }
    doc.fillColor(GOLD).fontSize(14).text("Chiffres cles", 50, y);
    y += 22;
    for (const num of mod.keyNumbers) {
      if (y > 720) { doc.addPage(); y = 50; }
      doc.fillColor(GOLD).fontSize(11).text(num.value, 50, y, { continued: true });
      doc.fillColor(GRAY).fontSize(10).text(`  ${num.label}`, { lineGap: 3 });
      y = doc.y + 6;
    }
    y += 10;
  }

  // ── Checklist ──
  if (y > 600) { doc.addPage(); y = 50; }
  doc.fillColor(GOLD).fontSize(14).text("Checklist -A faire", 50, y);
  y += 22;
  for (const item of mod.checklist) {
    if (y > 720) { doc.addPage(); y = 50; }
    doc.fillColor(GRAY).fontSize(10).text("[ ]", 50, y);
    doc.fillColor(DARK).fontSize(10).text(item, 68, y, {
      width: pageWidth - 18,
      lineGap: 3,
    });
    y = doc.y + 8;
  }
  y += 10;

  // ── Pro Tips ──
  if (y > 600) { doc.addPage(); y = 50; }
  doc.fillColor(GOLD).fontSize(14).text("Astuces de pro", 50, y);
  y += 22;
  for (const tip of mod.proTips) {
    if (y > 720) { doc.addPage(); y = 50; }
    doc.fillColor(GOLD).fontSize(10).text("*", 50, y);
    doc.fillColor(DARK).fontSize(10).text(tip, 68, y, {
      width: pageWidth - 18,
      lineGap: 3,
    });
    y = doc.y + 10;
  }
  y += 10;

  // ── Tools ──
  if (mod.tools && mod.tools.length > 0) {
    if (y > 680) { doc.addPage(); y = 50; }
    doc.fillColor(GOLD).fontSize(14).text("Outils & liens utiles", 50, y);
    y += 22;
    for (const tool of mod.tools) {
      if (y > 720) { doc.addPage(); y = 50; }
      doc.fillColor(DARK).fontSize(10).text(`${tool.name}`, 50, y, { continued: true });
      doc.fillColor(GRAY).fontSize(9).text(`  -${tool.url}`, { lineGap: 3 });
      y = doc.y + 6;
    }
  }

  // ── Footer ──
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fillColor(GRAY).opacity(0.5).fontSize(8)
      .text(
        `vanzonexplorer.com -Van Business Academy -Module ${mod.moduleNum}`,
        50,
        doc.page.height - 35,
        { width: pageWidth, align: "center" }
      );
  }

  doc.end();

  return new Promise<string>((resolve) => {
    stream.on("finish", () => {
      const size = fs.statSync(filePath).size;
      console.log(`  ✅ Module ${mod.moduleNum} -${(size / 1024).toFixed(0)} KB`);
      resolve(filePath);
    });
  });
}

// ── Main ──
async function main() {
  console.log("📄 Generation des PDFs VBA...\n");

  for (const mod of MODULES) {
    await generatePDF(mod);
  }

  console.log(`\n🎉 ${MODULES.length} PDFs generes dans ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
