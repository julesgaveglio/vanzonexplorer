/**
 * Range un export SketchUp COLLADA dans `public/plans-3d/<slug>/`.
 *
 *   npx tsx scripts/prepare-plan-3d.ts <export.dae|dossier> <slug> ["Libellé"] [--exclude=Nom,Nom]
 *
 * SketchUp sort un dossier `Truc.dae/` contenant `<uuid>.dae` + un dossier
 * `<uuid>/` de textures en pleine résolution (18 Mo par JPEG sur le meuble
 * glacière). Le script :
 *   - copie le .dae sous un nom propre,
 *   - réduit les textures (max 1600 px, qualité 70) et déduplique les
 *     fichiers identiques,
 *   - réécrit les <init_from> vers `textures/…`,
 *   - affiche l'arborescence des composants lue par le viewer et la ligne à
 *     coller dans le tableau PLANS de /admin/plan-3d.
 *
 * macOS uniquement (utilise `sips` pour le redimensionnement).
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const MAX_TEXTURE_PX = 1600;
const JPEG_QUALITY = 70;
const PUBLIC_DIR = path.join(process.cwd(), "public", "plans-3d");

function fail(message: string): never {
  console.error(`✖ ${message}`);
  process.exit(1);
}

/**
 * Accepte le modèle lui-même ou le dossier qui le contient. Les exports
 * SketchUp sortent un dossier `.dae/`, les téléchargements Sketchfab un
 * dossier glTF (scene.gltf + .bin + textures) ou un .glb autonome.
 */
function resolveSource(input: string) {
  const target = path.resolve(input.replace(/^~/, process.env.HOME ?? "~"));
  if (!fs.existsSync(target)) fail(`introuvable : ${target}`);
  if (fs.statSync(target).isFile()) return target;
  const models = fs
    .readdirSync(target)
    // `._machin.dae` : métadonnées AppleDouble des disques externes, à ignorer
    .filter((f) => /\.(dae|glb|gltf)$/i.test(f) && !f.startsWith("._"))
    .map((f) => path.join(target, f));
  if (models.length !== 1) {
    fail(`${models.length} modèle(s) (.dae/.glb/.gltf) dans ${target} — passe le fichier directement`);
  }
  return models[0];
}

/** Copie récursive d'un dossier (glTF + .bin + textures). */
function copyDirectory(from: string, to: string) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const destination = path.join(to, entry.name);
    if (entry.isDirectory()) copyDirectory(source, destination);
    else fs.copyFileSync(source, destination);
  }
}

/** `Texture Bois_Plank.jpg` → `texture-bois-plank.jpg` */
function slugifyFile(name: string) {
  const ext = path.extname(name).toLowerCase();
  return (
    path
      .basename(name, path.extname(name))
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() + ext
  );
}

/**
 * Retire un nœud de la scène par son nom (et tout son contenu). Sert à jeter
 * ce qui traîne dans un export : personnages d'échelle, mobilier voisin…
 * Comptage de profondeur sur le texte brut : SketchUp écrit une balise par
 * ligne, et on ne veut surtout pas réécrire tout le XML au passage.
 */
function removeSceneNode(xml: string, name: string) {
  const open = new RegExp(`^([ \\t]*)<node(?: id="[^"]*")? name="${name}"[^>]*>`, "m");
  const match = open.exec(xml);
  if (!match) return { xml, removed: false };
  const indent = match[1];
  const start = match.index;
  const closing = `\n${indent}</node>`;
  let depth = 1;
  let cursor = start + match[0].length;
  while (depth > 0) {
    const nextOpen = xml.indexOf("<node", cursor);
    const nextClose = xml.indexOf("</node>", cursor);
    if (nextClose === -1) return { xml, removed: false };
    if (nextOpen !== -1 && nextOpen < nextClose) {
      // Une balise auto-fermante <node …/> n'ouvre pas de niveau
      const tagEnd = xml.indexOf(">", nextOpen);
      if (xml[tagEnd - 1] !== "/") depth += 1;
      cursor = tagEnd + 1;
    } else {
      depth -= 1;
      cursor = nextClose + "</node>".length;
    }
  }
  const end = xml.slice(start, cursor).endsWith(closing.trimStart()) ? cursor : cursor;
  return { xml: xml.slice(0, start) + xml.slice(end).replace(/^\n[ \t]*/, "\n" + indent), removed: true };
}

const args = process.argv.slice(2);
const excluded = (args.find((a) => a.startsWith("--exclude="))?.slice(10) ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const [rawSource, slug, label] = args.filter((a) => !a.startsWith("--"));
if (!rawSource || !slug) {
  fail('usage : npx tsx scripts/prepare-plan-3d.ts <export.dae|dossier> <slug> ["Libellé"] [--exclude=Nom]');
}
if (!/^[a-z0-9-]+$/.test(slug)) fail("le slug doit être en minuscules, chiffres et tirets");

const sourceDae = resolveSource(rawSource);
const sourceDir = path.dirname(sourceDae);
const destDir = path.join(PUBLIC_DIR, slug);
const texturesDir = path.join(destDir, "textures");

// Réimporter un plan remplace la version précédente : on repart d'un dossier
// vide pour ne jamais laisser traîner l'ancienne géométrie ou ses textures.
fs.rmSync(destDir, { recursive: true, force: true });

// ── glTF / GLB : rien à retraiter, le format embarque déjà ses ressources ──
if (/\.(glb|gltf)$/i.test(sourceDae)) {
  const extension = path.extname(sourceDae).toLowerCase();
  if (extension === ".glb") {
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(sourceDae, path.join(destDir, `${slug}.glb`));
  } else {
    // Un .gltf s'accompagne de ses .bin et de ses textures : on copie tout
    // le dossier et on renomme juste le point d'entrée.
    copyDirectory(sourceDir, destDir);
    fs.renameSync(path.join(destDir, path.basename(sourceDae)), path.join(destDir, `${slug}.gltf`));
  }
  const size = fs
    .readdirSync(destDir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .reduce((total, e) => total + fs.statSync(path.join(e.parentPath ?? destDir, e.name)).size, 0);
  console.log(`\n✅ ${slug} → public/plans-3d/${slug}/  (${(size / 1e6).toFixed(1)} Mo)`);
  console.log(`\n  {`);
  console.log(`    slug: "${slug}",`);
  console.log(`    label: "${label ?? slug}",`);
  console.log(`    src: "/plans-3d/${slug}/${slug}${extension}",`);
  console.log(`    note: "Modèle glTF importé.",`);
  console.log(`  },\n`);
  console.log("  ⚠ Vérifie l'échelle : ouvre le plan et compare la cote d'encombrement");
  console.log("    en bas à droite aux dimensions constructeur.\n");
  process.exit(0);
}

fs.mkdirSync(texturesDir, { recursive: true });
let xml = fs.readFileSync(sourceDae, "utf8");

for (const name of excluded) {
  const result = removeSceneNode(xml, name);
  xml = result.xml;
  console.log(result.removed ? `↷ « ${name} » retiré de la scène` : `⚠ « ${name} » introuvable dans la scène`);
}

// ── Textures ───────────────────────────────────────────────────────────────
const references = [...xml.matchAll(/<init_from>([^<]+)<\/init_from>/g)].map((m) => m[1]);
const byHash = new Map<string, string>(); // md5 du fichier source → nom final
let sourceBytes = 0;
let destBytes = 0;

for (const reference of new Set(references)) {
  // <init_from> sert aussi à référencer une image par son id dans les
  // <surface> des effets : on ne garde que ce qui ressemble à un fichier.
  if (!/\.(jpe?g|png|tiff?|bmp|gif|tga)$/i.test(reference)) continue;
  if (/^(https?:|data:|textures\/)/.test(reference)) continue;
  const from = path.join(sourceDir, decodeURIComponent(reference));
  if (!fs.existsSync(from)) {
    console.warn(`⚠ texture absente, référence laissée telle quelle : ${reference}`);
    continue;
  }
  const hash = createHash("md5").update(fs.readFileSync(from)).digest("hex");
  let finalName = byHash.get(hash);
  if (!finalName) {
    finalName = slugifyFile(path.basename(from));
    let n = 2;
    while (fs.existsSync(path.join(texturesDir, finalName))) {
      const ext = path.extname(finalName);
      finalName = `${path.basename(finalName, ext)}-${n++}${ext}`;
    }
    const to = path.join(texturesDir, finalName);
    execFileSync("sips", [
      "-Z", String(MAX_TEXTURE_PX),
      "-s", "formatOptions", String(JPEG_QUALITY),
      from, "--out", to,
    ], { stdio: "ignore" });
    sourceBytes += fs.statSync(from).size;
    destBytes += fs.statSync(to).size;
    byHash.set(hash, finalName);
  }
  // Échappe la référence pour l'utiliser dans une RegExp
  const escaped = reference.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  xml = xml.replace(
    new RegExp(`<init_from>${escaped}</init_from>`, "g"),
    `<init_from>textures/${finalName}</init_from>`
  );
}

fs.writeFileSync(path.join(destDir, `${slug}.dae`), xml);

// ── Contrôle de la structure lue par le viewer ─────────────────────────────
// Reproduit la logique de Van3DViewer : niveau 1 = enfants du groupe racine,
// niveau 2 = leurs enfants (composants → nom de la définition).
const definitions = new Map<string, string>();
for (const match of xml.matchAll(/<node id="([^"]+)" name="([^"]+)"/g)) {
  definitions.set(match[1], match[2]);
}
const pretty = (name: string) => name.replace(/_/g, " ").trim();

const scene = xml.slice(
  xml.indexOf("<library_visual_scenes>"),
  xml.indexOf("</library_visual_scenes>")
);
const depths: { depth: number; name: string }[] = [];
let depth = 0;
for (const line of scene.split("\n")) {
  const open = /<node(?: id="([^"]*)")? name="([^"]+)"/.exec(line);
  const instance = /<instance_node url="#([^"]+)"/.exec(line);
  if (instance) {
    const target = definitions.get(instance[1]);
    if (target && depths.length) depths[depths.length - 1].name = pretty(target);
  }
  if (open) {
    depths.push({ depth, name: pretty(open[2]) });
    if (!line.includes("/>")) depth += 1;
  }
  depth -= (line.match(/<\/node>/g) ?? []).length;
}

const meaningful = depths.filter((d) => !/^skp_camera/.test(d.name));
const rootDepth = Math.min(...meaningful.map((d) => d.depth));
const families = meaningful.filter((d) => d.depth === rootDepth + 2);
const pieces = meaningful.filter((d) => d.depth === rootDepth + 3);

console.log(`\n✅ ${slug} → public/plans-3d/${slug}/`);
console.log(`   .dae      ${(fs.statSync(path.join(destDir, `${slug}.dae`)).size / 1024).toFixed(0)} Ko`);
if (byHash.size) {
  console.log(
    `   textures  ${byHash.size} fichier(s), ${(sourceBytes / 1e6).toFixed(1)} Mo → ${(destBytes / 1e6).toFixed(2)} Mo`
  );
}
// Note : les composants étant définis ailleurs dans le fichier (library_nodes),
// ce survol ne descend pas dans les instances — il donne le 1er niveau, celui
// qui pilote le panneau « Aménagements ».
console.log(`\n   Groupes de 1er niveau :`);
for (const family of families) {
  console.log(`   • ${family.name}`);
}
if (!families.length) console.log("   ⚠ aucun groupe de niveau 1 — vérifie la hiérarchie SketchUp");
if (pieces.length) console.log(`   (+ ${pieces.length} sous-groupes directs)`);
console.log();

// ── Contrôle qualité du modèle ─────────────────────────────────────────────
// Repère ce qui se voit mal dans SketchUp mais gêne dans le viewer : pièces
// sans nom, doublons, géométrie parasite, matériaux par défaut.
const warnings: string[] = [];
const infos: string[] = [];

// 1. Nœuds de la scène qui n'instancient rien de nommé → « Composant N »
const anonymous = [...xml.matchAll(/<node id="[^"]*" name="(SketchUp_Instance_\d+)">\s*(?:<matrix>[^<]*<\/matrix>\s*)?<instance_geometry/g)];
if (anonymous.length) {
  warnings.push(
    `${anonymous.length} pièce(s) sans nom de composant — elles s'afficheront « Composant N ».\n     ` +
      `Dans SketchUp : sélectionner la pièce, Entity Info, remplir le champ Définition.`
  );
}

// 2. Doublons de noms de définition (deux pièces identiques dans le panneau)
const names = [...xml.matchAll(/<node id="ID\d+" name="([^"]+)"/g)].map((m) => m[1]);
const duplicates = [...new Set(names.filter((n, i) => names.indexOf(n) !== i && !/^SketchUp_Instance/.test(n)))];
if (duplicates.length) {
  warnings.push(
    `Nom(s) portés par plusieurs composants : ${duplicates.slice(0, 4).join(", ")}${duplicates.length > 4 ? "…" : ""}.\n     ` +
      `Ils seront indiscernables dans le panneau — « Rendre unique » puis renommer.`
  );
}

// 3. Arêtes libres exportées : elles cassent le cadrage et polluent l'accroche
const looseEdges = (xml.match(/<lines\b/g) ?? []).length;
if (looseEdges) {
  warnings.push(
    `${looseEdges} groupe(s) d'arêtes sans face (traits isolés dans un composant).\n     ` +
      `À supprimer dans SketchUp, ou décocher « Exporter les arêtes ».`
  );
}

// 4. Définitions jamais instanciées : poids mort dans le fichier
const referenced = new Set([...xml.matchAll(/<instance_node url="#([^"]+)"/g)].map((m) => m[1]));
const libraryStart = xml.indexOf("<library_nodes>");
const orphans =
  libraryStart === -1
    ? []
    : [...xml.slice(libraryStart).matchAll(/<node id="(ID\d+)" name="([^"]+)"/g)]
        .filter((m) => !referenced.has(m[1]))
        .map((m) => m[2]);
if (orphans.length > 1) {
  infos.push(`${orphans.length} définition(s) non utilisée(s) dans la scène (poids mort du fichier).`);
}

// 5. Matériaux laissés au nom par défaut
const defaultMaterials = [...xml.matchAll(/<material id="[^"]*" name="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((n) => /^(material|mat[ée]riau|mati[èe]re)[_\d]*$/i.test(n));
if (defaultMaterials.length) {
  infos.push(
    `${defaultMaterials.length} matériau(x) au nom par défaut (${defaultMaterials.slice(0, 3).join(", ")}) — ` +
      `à nommer pour la future liste de débit.`
  );
}

// 6. Noms mal formés
const messy = names.filter((n) => /^[_\s]|__|\s$/.test(n) && !/^SketchUp_Instance/.test(n));
if (messy.length) {
  infos.push(`Noms à nettoyer (espaces en tête ou doubles séparateurs) : ${messy.slice(0, 3).join(", ")}.`);
}

if (warnings.length || infos.length) {
  console.log("   Contrôle du modèle :");
  for (const warning of warnings) console.log(`   ⚠ ${warning}`);
  for (const info of infos) console.log(`   · ${info}`);
  console.log();
} else {
  console.log("   Contrôle du modèle : rien à signaler.\n");
}

console.log(`   À ajouter dans le tableau PLANS de src/app/admin/(protected)/plan-3d/page.tsx :\n`);
console.log(`  {`);
console.log(`    slug: "${slug}",`);
console.log(`    label: "${label ?? slug}",`);
console.log(`    src: "/plans-3d/${slug}/${slug}.dae",`);
console.log(`    note: "Export SketchUp COLLADA.",`);
console.log(`  },\n`);
