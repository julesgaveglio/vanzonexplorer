/**
 * Génère un GLB de démo : aménagement de van aux cotes réalistes (mètres).
 * Sert au prototype du viewer 3D (/admin/plan-3d) en attendant les vrais
 * exports SketchUp (Fichier > Exporter > Modèle 3D > .glb).
 *
 * Usage : npx tsx scripts/generate-demo-van-glb.ts
 * Sortie : public/demo/van-amenagement-demo.glb
 */
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { Document, NodeIO, Material } from "@gltf-transform/core";

const OUTPUT = join(process.cwd(), "public/demo/van-amenagement-demo.glb");

// Géométrie d'une boîte centrée à l'origine (24 sommets, normales par face)
function boxGeometry(w: number, h: number, d: number) {
  const x = w / 2;
  const y = h / 2;
  const z = d / 2;
  // 6 faces × 4 sommets
  const positions = new Float32Array([
    // +X
    x, -y, -z, x, y, -z, x, y, z, x, -y, z,
    // -X
    -x, -y, z, -x, y, z, -x, y, -z, -x, -y, -z,
    // +Y
    -x, y, -z, -x, y, z, x, y, z, x, y, -z,
    // -Y
    -x, -y, z, -x, -y, -z, x, -y, -z, x, -y, z,
    // +Z
    -x, -y, z, x, -y, z, x, y, z, -x, y, z,
    // -Z
    x, -y, -z, -x, -y, -z, -x, y, -z, x, y, -z,
  ]);
  const normals = new Float32Array(
    [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ].flatMap((n) => [...n, ...n, ...n, ...n])
  );
  const indices = new Uint16Array(
    Array.from({ length: 6 }, (_, f) => {
      const o = f * 4;
      return [o, o + 1, o + 2, o, o + 2, o + 3];
    }).flat()
  );
  return { positions, normals, indices };
}

interface Part {
  name: string;
  size: [number, number, number]; // L (X) × H (Y) × l (Z) en mètres
  position: [number, number, number]; // centre
  color: [number, number, number];
}

// Base d'un fourgon L3 (type Ducato) : plancher ~3,70 m × 1,87 m
const PARTS: Part[] = [
  { name: "Plancher", size: [3.7, 0.02, 1.87], position: [0, 0.01, 0], color: [0.55, 0.42, 0.28] },
  { name: "Lit fixe 190x140", size: [1.9, 0.45, 1.4], position: [0.9, 0.245, 0], color: [0.38, 0.45, 0.62] },
  { name: "Meuble cuisine", size: [1.2, 0.9, 0.6], position: [-1.0, 0.47, -0.635], color: [0.3, 0.34, 0.4] },
  { name: "Colonne douche", size: [0.8, 1.9, 0.8], position: [0.1, 0.97, 0.535], color: [0.62, 0.78, 0.85] },
  { name: "Penderie", size: [0.6, 1.2, 0.6], position: [-1.55, 0.62, 0.635], color: [0.5, 0.38, 0.26] },
  { name: "Reservoir eau propre 100L", size: [0.6, 0.3, 0.35], position: [1.5, 0.17, -0.5], color: [0.25, 0.5, 0.8] },
  { name: "Batterie lithium", size: [0.35, 0.25, 0.25], position: [1.72, 0.145, 0.55], color: [0.85, 0.72, 0.25] },
  { name: "Passage de roue gauche", size: [1.1, 0.25, 0.25], position: [0.9, 0.145, -0.81], color: [0.2, 0.2, 0.22] },
  { name: "Passage de roue droit", size: [1.1, 0.25, 0.25], position: [0.9, 0.145, 0.81], color: [0.2, 0.2, 0.22] },
];

async function main() {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene("Amenagement van (demo)");
  doc.getRoot().setDefaultScene(scene);

  const materials = new Map<string, Material>();

  for (const part of PARTS) {
    const key = part.color.join(",");
    let material = materials.get(key);
    if (!material) {
      material = doc
        .createMaterial(`mat-${materials.size}`)
        .setBaseColorFactor([...part.color, 1])
        .setRoughnessFactor(0.9)
        .setMetallicFactor(0);
      materials.set(key, material);
    }

    const { positions, normals, indices } = boxGeometry(...part.size);
    const primitive = doc
      .createPrimitive()
      .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(positions).setBuffer(buffer))
      .setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(normals).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType("SCALAR").setArray(indices).setBuffer(buffer))
      .setMaterial(material);

    const node = doc
      .createNode(part.name)
      .setMesh(doc.createMesh(part.name).addPrimitive(primitive))
      .setTranslation(part.position);
    scene.addChild(node);
  }

  mkdirSync(dirname(OUTPUT), { recursive: true });
  await new NodeIO().write(OUTPUT, doc);
  console.log(`✅ GLB de démo généré : ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
