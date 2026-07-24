"use client";

/**
 * Viewer 3D des plans d'aménagement (prototype VBA).
 *
 * Charge un export SketchUp — .glb (Fichier > Exporter > Modèle 3D > .glb) ou
 * .dae/COLLADA (unités et axe Z-UP convertis automatiquement par le loader) —
 * et offre des outils de mesure type SketchUp via That Open Engine (licence MIT) :
 * - Mètre point à point (aimanté aux sommets)
 * - Cote d'arête au survol (l'arête s'illumine et affiche sa dimension)
 * - Isolation de chaque composant / sous-composant du modèle
 * - Contours noirs pour distinguer les planches
 *
 * Les librairies 3D (~1 Mo gzip) sont chargées dynamiquement côté client
 * uniquement, au montage du composant — aucun impact sur le reste du site.
 */

import { useEffect, useRef, useState } from "react";

type Mode = "orbit" | "interact" | "length" | "edge";
type Units = "cm" | "m";
type Theme = "light" | "dark";
/** Type de point accroché sous le curseur en mode Mètre. */
type SnapKind = "vertex" | "aligned" | "midpoint" | "edge" | "face";

const SNAP_LABELS: Record<SnapKind, string> = {
  vertex: "sommet",
  aligned: "sur l'arête",
  midpoint: "milieu d'arête",
  edge: "sur l'arête",
  face: "sur la face",
};

/** Priorité d'accrochage : un sommet l'emporte sur une arête, etc. */
const SNAP_RANK: Record<SnapKind, number> = {
  vertex: 0,
  aligned: 1,
  midpoint: 2,
  edge: 3,
  face: 4,
};

/** Un composant du modèle (groupe SketchUp) et ses sous-composants. */
interface PartNode {
  id: number;
  name: string;
  children: PartNode[];
}

interface ViewerHandles {
  dispose: () => void;
  setMode: (mode: Mode) => void;
  setUnits: (units: Units) => void;
  setTheme: (theme: Theme) => void;
  setEdges: (visible: boolean) => void;
  setExplode: (target: number, refit: boolean) => void;
  toggleMovableAt: (clientX: number, clientY: number) => string | null;
  movableAt: (clientX: number, clientY: number) => string | null;
  setHidden: (ids: number[]) => void;
  frameVisible: () => void;
  recenter: () => void;
  clear: () => void;
}

const HINTS: Record<Mode, string> = {
  orbit: "Clic gauche : pivoter · Molette : zoom · Double-clic : centrer sur un point",
  interact: "Cliquez une porte, une trappe ou un tiroir pour l'ouvrir ou le fermer",
  length: "Cliquez 2 points — accroche sommets, milieux et arêtes · Échap : annuler",
  edge: "Survolez une arête pour voir sa cote · Cliquez pour la fixer",
};

/**
 * Palettes de la scène 3D — le mode clair est le défaut (rendu type SketchUp).
 * Doré Van Business Academy (--gold / --gold-light de globals.css) pour les
 * annotations ; en fond sombre on prend la variante claire du dégradé.
 */
const GOLD = "#B9945F";
const GOLD_LIGHT = "#E4D398";
/** Bronze : le doré clair se perd sur le contreplaqué, les traits sont foncés. */
const GOLD_DARK = "#7A5A2E";
const THEMES: Record<Theme, { bg: string; grid: string; accent: string; line: string }> = {
  light: { bg: "#f3f5f9", grid: "#b9c1d1", accent: GOLD, line: GOLD_DARK },
  dark: { bg: "#10151f", grid: "#5b6880", accent: GOLD_LIGHT, line: GOLD_LIGHT },
};

/** Nom lisible d'un composant SketchUp : « ___Meuble_glacière » → « Meuble glacière ». */
function prettify(name: string) {
  return name.replace(/_/g, " ").trim();
}

/**
 * Dans un COLLADA, un composant posé dans le modèle donne un nœud
 * « SketchUp_Instance_N » qui pointe vers la définition (le vrai nom) via
 * <instance_node>. Le ColladaLoader de three écrase le nom de la définition
 * par celui de l'instance (buildNode) : on relit donc le XML pour retrouver
 * la correspondance instance → nom du composant.
 */
async function loadDaeInstanceNames(src: string) {
  const names = new Map<string, string>();
  try {
    const xml = new DOMParser().parseFromString(
      await (await fetch(src)).text(),
      "application/xml"
    );
    const nodes = Array.from(xml.getElementsByTagName("node"));
    const byId = new Map<string, string>();
    for (const node of nodes) {
      const id = node.getAttribute("id");
      const name = node.getAttribute("name");
      if (id && name) byId.set(id, name);
    }
    for (const node of nodes) {
      const name = node.getAttribute("name");
      const ref = Array.from(node.children)
        .find((c) => c.tagName === "instance_node")
        ?.getAttribute("url");
      const target = ref?.startsWith("#") ? byId.get(ref.slice(1)) : undefined;
      if (name && target) names.set(name, target);
    }
  } catch {
    // Nom d'instance non résolu : on gardera le nom brut du nœud.
  }
  return names;
}

// ── Icônes ─────────────────────────────────────────────────────────────────
// Tracés du jeu Lucide (licence ISC) : cohérents entre eux et lisibles à 15 px.

const svg = {
  width: 15,
  height: 15,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** lucide/rotate-3d — orbiter autour du modèle */
const IconOrbit = () => (
  <svg {...svg}>
    <path d="M16.466 7.5C15.643 4.237 13.952 2 12 2 9.239 2 7 6.477 7 12s2.239 10 5 10c.342 0 .677-.069 1-.2" />
    <path d="m15.194 13.707 3.814 1.86-1.86 3.814" />
    <path d="M19 15.57c-1.804.885-4.274 1.43-7 1.43-5.523 0-10-2.239-10-5s4.477-5 10-5c4.838 0 8.873 1.718 9.8 4" />
  </svg>
);

/** lucide/ruler — mètre à ruban */
const IconRuler = () => (
  <svg {...svg}>
    <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
    <path d="m14.5 12.5 2-2" />
    <path d="m11.5 9.5 2-2" />
    <path d="m8.5 6.5 2-2" />
    <path d="m17.5 15.5 2-2" />
  </svg>
);

/** lucide/ruler-dimension-line — ligne de cote */
const IconDimension = () => (
  <svg {...svg}>
    <path d="M3 4v4M21 4v4M3 6h18" />
    <rect x="3" y="11" width="18" height="8" rx="1.5" />
    <path d="M8 19v-3M12 19v-3M16 19v-3" />
  </svg>
);

/** lucide/locate-fixed — recentrer la vue */
const IconTarget = () => (
  <svg {...svg}>
    <path d="M2 12h3M19 12h3M12 2v3M12 19v3" />
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

/** lucide/box — contours des planches */
const IconEdges = () => (
  <svg {...svg}>
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);

/** lucide/pointer — l'outil « Interagir » de SketchUp : le doigt qui clique */
const IconInteract = () => (
  <svg {...svg}>
    <path d="M22 14a8 8 0 0 1-8 8" />
    <path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
    <path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1" />
    <path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10" />
    <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
);

/** Vue éclatée : deux plaques écartées */
const IconExplode = () => (
  <svg {...svg}>
    <path d="M12 2 3.5 5.5 12 9l8.5-3.5L12 2Z" />
    <path d="M12 15 3.5 18.5 12 22l8.5-3.5L12 15Z" />
    <path d="M12 11v2" />
  </svg>
);

/** lucide/eraser — effacer les mesures */
const IconEraser = () => (
  <svg {...svg}>
    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
    <path d="M22 21H7" />
    <path d="m5 11 9 9" />
  </svg>
);

/** lucide/sun */
const IconSun = () => (
  <svg {...svg}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

/** lucide/moon */
const IconMoon = () => (
  <svg {...svg}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

/** lucide/focus — isoler un composant */
const IconFocus = () => (
  <svg {...svg} width={13} height={13}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/** lucide/chevron-right — pivote de 90° une fois déplié (ou vers le bas). */
const IconChevron = ({ open, down = false }: { open: boolean; down?: boolean }) => (
  <svg
    {...svg}
    width={13}
    height={13}
    style={{ transform: `rotate(${down ? (open ? 270 : 90) : open ? 90 : 0}deg)`, transition: "transform .15s" }}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export default function Van3DViewer({
  src,
  className = "",
  defaultTheme = "light",
}: {
  src: string;
  className?: string;
  defaultTheme?: Theme;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handlesRef = useRef<ViewerHandles | null>(null);
  const modeRef = useRef<Mode>("orbit");
  const themeRef = useRef<Theme>(defaultTheme);

  const [mode, setModeState] = useState<Mode>("orbit");
  const [units, setUnitsState] = useState<Units>("cm");
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [edges, setEdgesState] = useState(true);
  const [explode, setExplodeState] = useState(0);
  const [movableCount, setMovableCount] = useState(0);
  const [snapHint, setSnapHint] = useState<string | null>(null);
  const [tree, setTree] = useState<PartNode[]>([]);
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [showParts, setShowParts] = useState(true);
  // Sur un écran étroit le panneau mangerait la moitié de la vue : replié au départ.
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) setShowParts(false);
  }, []);
  const [size, setSize] = useState<[number, number, number] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const isLight = theme === "light";
  const palette = THEMES[theme];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let handles: ViewerHandles | null = null;

    (async () => {
      const [THREE, { deinterleaveGeometry, mergeVertices }, OBC, OBCF] = await Promise.all([
        import("three"),
        import("three/examples/jsm/utils/BufferGeometryUtils.js"),
        import("@thatopen/components"),
        import("@thatopen/components-front"),
      ]);
      if (disposed) return;

      // ── Monde 3D (scène + caméra + renderer avec labels 2D) ──────────────
      const components = new OBC.Components();
      const worlds = components.get(OBC.Worlds);
      const world = worlds.create<
        InstanceType<typeof OBC.SimpleScene>,
        InstanceType<typeof OBC.OrthoPerspectiveCamera>,
        InstanceType<typeof OBCF.RendererWith2D>
      >();
      world.scene = new OBC.SimpleScene(components);
      world.renderer = new OBCF.RendererWith2D(components, container);
      world.camera = new OBC.OrthoPerspectiveCamera(components);
      components.init();

      world.scene.setup();

      const dom2d = world.renderer.three2D.domElement;
      dom2d.style.position = "absolute";
      dom2d.style.top = "0";
      dom2d.style.left = "0";
      dom2d.style.pointerEvents = "none";
      container.appendChild(dom2d);

      const grid = components.get(OBC.Grids).create(world);

      // ── Chargement du modèle (GLB ou COLLADA/.dae) ───────────────────────
      // Le ColladaLoader applique lui-même l'unité du fichier (pouces pour un
      // export SketchUp) et la rotation Z-UP → Y-UP sur la racine ; le bake de
      // matrices plus bas fige tout ça dans les géométries.
      let model: InstanceType<typeof THREE.Object3D>;
      let instanceNames = new Map<string, string>();
      if (/\.dae(\?|#|$)/i.test(src)) {
        const { ColladaLoader } = await import(
          "three/examples/jsm/loaders/ColladaLoader.js"
        );
        [model, instanceNames] = await Promise.all([
          new ColladaLoader().loadAsync(src).then((c) => c.scene),
          loadDaeInstanceNames(src),
        ]);
      } else {
        const { GLTFLoader } = await import(
          "three/examples/jsm/loaders/GLTFLoader.js"
        );
        model = (await new GLTFLoader().loadAsync(src)).scene;
      }
      if (disposed) {
        components.dispose();
        return;
      }
      world.scene.three.add(model);

      // Racine « utile » des composants : on descend tant qu'il n'y a qu'un
      // seul enfant porteur de géométrie (les exports SketchUp emboîtent le
      // modèle sous 1-2 nœuds techniques avant d'atteindre les vrais groupes).
      const hasMesh = (obj: InstanceType<typeof THREE.Object3D>) => {
        let found = false;
        obj.traverse((c) => {
          if ((c as { isMesh?: boolean }).isMesh) found = true;
        });
        return found;
      };
      /**
       * Un enfant est une pièce à part entière s'il est un groupe, ou un mesh
       * qui porte un nom : le ColladaLoader réduit un composant d'une seule
       * géométrie à un mesh nommé, tandis que les morceaux issus du découpage
       * d'un panneau par matériau (fentes d'aération, perçages) arrivent en
       * meshes anonymes — eux doivent rester solidaires de leur planche.
       */
      const isPart = (child: InstanceType<typeof THREE.Object3D>) =>
        hasMesh(child) && (!(child as { isMesh?: boolean }).isMesh || Boolean(child.name));

      let partsRoot = model;
      for (;;) {
        const kids = partsRoot.children.filter(isPart);
        if (kids.length !== 1) break;
        partsRoot = kids[0];
      }

      // Un nœud d'instance SketchUp n'a pas de nom parlant : on prend celui du
      // composant qu'il instancie (table lue dans le XML), sinon celui du
      // premier descendant nommé.
      const resolveName = (
        obj: InstanceType<typeof THREE.Object3D>,
        index: number
      ) => {
        let name = instanceNames.get(obj.name) ?? obj.name;
        if (!name || /^SketchUp_Instance/i.test(name)) {
          const start = name;
          obj.traverse((c) => {
            if (name === start && c !== obj && c.name && !/^SketchUp_Instance/i.test(c.name)) {
              name = c.name;
            }
          });
        }
        return /^SketchUp_Instance/i.test(name)
          ? `Composant ${index + 1}`
          : prettify(name) || `Composant ${index + 1}`;
      };

      // Arbre des composants, jusqu'à 3 niveaux : un plan peut être organisé en
      // étapes de montage (étape > famille > pièce), et on veut pouvoir isoler
      // et éclater jusqu'à la planche.
      const MAX_TREE_DEPTH = 3;
      const partObjects: InstanceType<typeof THREE.Object3D>[] = [];
      const makeNode = (
        obj: InstanceType<typeof THREE.Object3D>,
        index: number,
        depth: number
      ): PartNode => {
        const id = partObjects.push(obj) - 1;
        // Seuls les groupes comptent comme sous-composants. Un mesh enfant
        // n'est qu'un morceau de la pièce : SketchUp découpe la géométrie d'un
        // panneau par matériau, si bien qu'une planche percée de fentes sort en
        // plusieurs meshes. Les traiter comme des pièces faisait voler les
        // fentes et les trous séparément en vue éclatée.
        const kids = obj.children.filter(isPart);
        return {
          id,
          name: resolveName(obj, index),
          children:
            depth < MAX_TREE_DEPTH - 1 && kids.length > 1
              ? kids.map((k, i) => makeNode(k, i, depth + 1))
              : [],
        };
      };
      const partTree = partsRoot.children.filter(isPart).map((group, i) => makeNode(group, i, 0));

      // Les outils de mesure de That Open lisent les buffers de géométrie en
      // supposant des attributs non entrelacés et des transforms identité
      // (bug #534). On normalise donc chaque mesh au chargement :
      // 1. désentrelacement des attributs (les exporteurs GLB entrelacent
      //    souvent position/normal dans le même buffer)
      // 2. cuisson de la matrice monde dans la géométrie, puis transforms
      //    remis à l'identité. Les géométries partagées (composants SketchUp
      //    réutilisés) sont clonées pour ne pas être transformées deux fois.
      model.updateMatrixWorld(true);
      const baked = new Set<object>();
      const meshes: InstanceType<typeof THREE.Mesh>[] = [];
      model.traverse((child) => {
        // Tout ce qui porte une géométrie doit être cuit, pas seulement les
        // maillages : une arête isolée dans un composant SketchUp arrive ici
        // en LineSegments, et si on la laisse de côté elle garde ses
        // coordonnées locales en pouces alors qu'on remet les transforms à
        // l'identité — elle part alors à des dizaines de mètres et fait
        // exploser le cadrage et la cote d'encombrement.
        const object = child as InstanceType<typeof THREE.Mesh>;
        if (!object.geometry) return;
        if (baked.has(object.geometry)) object.geometry = object.geometry.clone();
        deinterleaveGeometry(object.geometry);
        // 3. indexation : la cote d'arête abandonne sans index (elle lit les
        //    faces via l'index), et le ColladaLoader produit du non indexé.
        if (object.isMesh && !object.geometry.index) {
          object.geometry = mergeVertices(object.geometry);
        }
        object.geometry.applyMatrix4(object.matrixWorld);
        baked.add(object.geometry);
        if (object.isMesh) meshes.push(object);
      });
      model.traverse((obj) => {
        obj.position.set(0, 0, 0);
        obj.quaternion.identity();
        obj.scale.set(1, 1, 1);
        obj.updateMatrix();
      });
      model.updateMatrixWorld(true);

      // ── Contours noirs : on voit où s'arrête chaque planche ──────────────
      // Les arêtes sont enfants de leur mesh (transforms identité après le
      // bake) : elles suivent donc automatiquement l'isolation des composants.
      const outlineMaterial = new THREE.LineBasicMaterial({
        color: 0x151515,
        transparent: true,
        opacity: 0.6,
      });
      const outlines: InstanceType<typeof THREE.LineSegments>[] = [];
      // Segments d'arêtes « propres » réutilisés par l'accrochage du mètre :
      // ce sont les vraies arêtes du modèle, sans les diagonales de
      // triangulation. Stockés en coordonnées locales du mesh pour rester
      // justes quand la vue éclatée déplace les composants.
      const snapSegments: {
        mesh: InstanceType<typeof THREE.Mesh>;
        a: InstanceType<typeof THREE.Vector3>;
        b: InstanceType<typeof THREE.Vector3>;
      }[] = [];
      // Compteurs servant à détecter l'option d'export « faces bifaces »
      // (triangles coïncidents dédoublés), voir plus bas.
      let trianglesTotal = 0;
      let trianglesUnique = 0;
      for (const mesh of meshes) {
        // Décale les faces vers l'arrière pour que les contours ne bavent pas.
        for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
          mat.polygonOffset = true;
          mat.polygonOffsetFactor = 1;
          mat.polygonOffsetUnits = 1;
        }
        // EdgesGeometry a besoin que les triangles voisins partagent leurs
        // sommets pour savoir qu'ils sont coplanaires. Les exports SketchUp
        // dupliquent les sommets (normales/UV différentes) : on refusionne sur
        // les seules positions, sinon chaque diagonale de triangulation
        // ressort en trait noir au milieu des planches.
        const positions = new THREE.BufferGeometry();
        positions.setAttribute("position", mesh.geometry.getAttribute("position"));
        if (mesh.geometry.index) positions.setIndex(mesh.geometry.index);
        // 40° : on garde les arêtes de planches (90°) sans faire ressortir les
        // facettes des formes arrondies (jerricanes).
        const merged = mergeVertices(positions);
        // SketchUp exporte chaque face en recto ET verso : les triangles
        // coïncidents ont des normales opposées (180°), donc EdgesGeometry
        // dessinait toutes les diagonales de triangulation au milieu des
        // planches. On ne garde qu'un triangle par trio de sommets.
        const index = merged.getIndex();
        if (index) {
          const seen = new Set<string>();
          const unique: number[] = [];
          for (let i = 0; i < index.count; i += 3) {
            const tri = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
            const key = tri.slice().sort((a, b) => a - b).join(",");
            if (seen.has(key)) continue;
            seen.add(key);
            unique.push(tri[0], tri[1], tri[2]);
          }
          merged.setIndex(unique);
          trianglesTotal += index.count / 3;
          trianglesUnique += unique.length / 3;
        }
        const edgesGeometry = new THREE.EdgesGeometry(merged, 40);
        const line = new THREE.LineSegments(edgesGeometry, outlineMaterial);
        positions.dispose();
        merged.dispose();

        const edgePositions = edgesGeometry.getAttribute("position");
        for (let i = 0; i < edgePositions.count; i += 2) {
          const a = new THREE.Vector3().fromBufferAttribute(edgePositions, i);
          const b = new THREE.Vector3().fromBufferAttribute(edgePositions, i + 1);
          // Les arêtes dégénérées (< 1 mm) ne servent ni à l'accroche ni à la
          // cote, et proposeraient une mesure de 0,0 cm.
          if (a.distanceTo(b) > 0.001) snapSegments.push({ mesh, a, b });
        }
        // Sans ça, le raycast des outils de mesure touche l'arête au lieu de
        // la face : plus aucun point n'est trouvé et le mètre ne pose rien.
        line.raycast = () => {};
        mesh.add(line);
        outlines.push(line);
      }

      // ── Faces simples ou bifaces ? ───────────────────────────────────────
      // L'option SketchUp « Exporter les faces bifaces » double chaque face en
      // sens inverse : le modèle est alors opaque des deux côtés même avec des
      // matériaux FrontSide. Si elle était décochée (fichier deux fois plus
      // léger), il faut passer les matériaux en DoubleSide, sinon on voit à
      // travers les planches par l'arrière. On le déduit du taux de triangles
      // coïncidents, plutôt que d'imposer un réglage à l'export.
      const twoSidedExport = trianglesUnique < trianglesTotal * 0.9;
      if (!twoSidedExport) {
        for (const mesh of meshes) {
          for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
            mat.side = THREE.DoubleSide;
          }
        }
      }

      // Un mesh n'est cliquable (mesure) que si lui et tous ses parents sont
      // visibles — recalculé à chaque changement d'isolation.
      const syncPickable = () => {
        const walk = (obj: InstanceType<typeof THREE.Object3D>, visible: boolean) => {
          const v = visible && obj.visible;
          if ((obj as { isMesh?: boolean }).isMesh) {
            if (v) world.meshes.add(obj as never);
            else world.meshes.delete(obj as never);
          }
          for (const child of obj.children) walk(child, v);
        };
        walk(model, true);
      };
      syncPickable();

      // ── Cadrage et garde-fous de navigation ─────────────────────────────
      const fullBox = new THREE.Box3().setFromObject(model);
      const dims = fullBox.getSize(new THREE.Vector3());
      const controls = world.camera.controls;

      // Le zoom reste centré sur la cible (pas de `dollyToCursor` : il déplace
      // la cible et on finit par perdre le meuble). Les bornes suivent ce qui
      // est visible : en isolant une planche, on peut zoomer bien plus près.
      controls.dollyToCursor = false;
      controls.infinityDolly = false;

      const focus = new THREE.Sphere();
      const updateFocus = () => {
        const box = new THREE.Box3();
        world.meshes.forEach((mesh) => box.expandByObject(mesh as never));
        if (box.isEmpty()) box.copy(fullBox);
        box.getBoundingSphere(focus);

        // Le plan de coupe par défaut de That Open est à 1 m : sur un meuble
        // de 60 cm il tranchait le modèle dès qu'on s'approchait (« on voit
        // l'intérieur »). On le cale sur la taille de ce qu'on regarde.
        const near = Math.max(0.005, focus.radius / 100);
        const far = Math.max(50, focus.radius * 500);
        for (const cam of [world.camera.threePersp, world.camera.threeOrtho]) {
          cam.near = near;
          cam.far = far;
          cam.updateProjectionMatrix();
        }

        // Zoom rapproché autorisé : le plan de coupe étant recalé sur la taille
        // du modèle, s'approcher ne tranche plus rien. Pour examiner un détail
        // sans finir au milieu du meuble, un double-clic recentre l'orbite sur
        // le point visé — on tourne et on zoome alors autour de ce point.
        controls.minDistance = Math.max(0.02, focus.radius * 0.06);
        controls.maxDistance = focus.radius * 8;
        // Le point visé reste dans un volume proche du modèle (pan borné).
        controls.setBoundary(box.clone().expandByScalar(focus.radius));
      };

      const frame = (transition: boolean) => {
        updateFocus();
        const c = focus.center;
        const r = focus.radius;
        controls.setLookAt(
          c.x + r * 1.6,
          c.y + r * 1.2,
          c.z + r * 1.6,
          c.x,
          c.y,
          c.z,
          transition
        );
        controls.fitToSphere(focus, transition);
      };
      frame(false);

      // ── Outils de mesure ─────────────────────────────────────────────────
      OBCF.SimpleDimensionLine.units = "cm";
      OBCF.SimpleDimensionLine.scale = 0.01;
      OBCF.SimpleDimensionLine.rounding = 1;

      const length = components.get(OBCF.LengthMeasurement);
      length.world = world;
      // Le picker de la lib n'accroche qu'aux sommets : on garde le composant
      // pour l'affichage des cotes (createOnPoints) mais on pilote nous-mêmes
      // le pointage, voir « Accrochage » plus bas. Il reste donc désactivé.
      length.enabled = false;

      // ── Thème (clair par défaut) ─────────────────────────────────────────
      const applyTheme = (t: Theme) => {
        const p = THEMES[t];
        world.scene.three.background = new THREE.Color(p.bg);
        grid.config.color = new THREE.Color(p.grid);
        length.color = new THREE.Color(p.line);
        outlineMaterial.color = new THREE.Color(t === "light" ? 0x151515 : 0x000000);
        outlineMaterial.opacity = t === "light" ? 0.6 : 0.75;
      };
      applyTheme(themeRef.current);

      // ── Accrochage du mètre (sommet / milieu / arête / face) ─────────────
      // On remplace le picker de la lib (sommets uniquement) : on projette les
      // arêtes à l'écran et on accroche le point le plus proche du curseur,
      // n'importe où le long d'une arête. Le 2e point s'aligne en plus sur un
      // axe (X/Y/Z) ou sur la direction de l'arête de départ quand on en est
      // proche — c'est ce qui permet de tracer une mesure parallèle.
      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      const pa = new THREE.Vector2();
      const pb = new THREE.Vector2();
      const AXES = [
        { dir: new THREE.Vector3(1, 0, 0), label: "axe X" },
        { dir: new THREE.Vector3(0, 1, 0), label: "axe Y" },
        { dir: new THREE.Vector3(0, 0, 1), label: "axe Z" },
      ];
      const COS_LOCK = Math.cos((6 * Math.PI) / 180);

      let rect = container.getBoundingClientRect();
      const refreshRect = () => {
        rect = container.getBoundingClientRect();
      };

      const project = (v: InstanceType<typeof THREE.Vector3>, out: InstanceType<typeof THREE.Vector2>) => {
        const p = v.clone().project(world.camera.three);
        out.set((p.x * 0.5 + 0.5) * rect.width, (-p.y * 0.5 + 0.5) * rect.height);
        return p.z; // > 1 = derrière la caméra
      };

      /** Distance 2D d'un point à un segment + position paramétrique. */
      const distToSegment2D = (
        px: number,
        py: number,
        a: InstanceType<typeof THREE.Vector2>,
        b: InstanceType<typeof THREE.Vector2>
      ) => {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len2 = dx * dx + dy * dy;
        const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / len2));
        return { dist: Math.hypot(a.x + t * dx - px, a.y + t * dy - py), t };
      };

      const snapPoint = new THREE.Vector3();
      const snapDir = new THREE.Vector3();
      let snapKind: SnapKind | null = null;
      let startPoint: InstanceType<typeof THREE.Vector3> | null = null;
      let startDir: InstanceType<typeof THREE.Vector3> | null = null;
      let lockLabel: string | null = null;

      /** Cherche le meilleur point d'accrochage sous le curseur. */
      const computeSnap = (clientX: number, clientY: number) => {
        ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;

        raycaster.setFromCamera(ndc, world.camera.three);
        const pickable: InstanceType<typeof THREE.Mesh>[] = [];
        world.meshes.forEach((m) => pickable.push(m as never));
        const faceHit = raycaster.intersectObjects(pickable, false)[0];
        const camPos = world.camera.three.position;
        const depthTolerance = focus.radius * 0.03;

        type Candidate = {
          kind: SnapKind;
          dist: number;
          point: InstanceType<typeof THREE.Vector3>;
          dir: InstanceType<typeof THREE.Vector3>;
          lock?: string;
        };
        let best: Candidate | null = null;
        const consider = (
          kind: SnapKind,
          dist: number,
          point: InstanceType<typeof THREE.Vector3>,
          dir: InstanceType<typeof THREE.Vector3>,
          lock?: string
        ) => {
          // Rejette ce qui est masqué derrière une face visible.
          if (faceHit && camPos.distanceTo(point) > faceHit.distance + depthTolerance) return;
          if (best && (SNAP_RANK[best.kind] < SNAP_RANK[kind] || (best.kind === kind && best.dist <= dist))) return;
          best = { kind, dist, point, dir, lock };
        };

        // Point de l'arête exactement aligné avec le 1er point sur un axe :
        // c'est ce qui permet de tracer une mesure vraiment parallèle à une
        // autre arête plutôt qu'« à peu près ».
        const alignTolerance = focus.radius * 0.005;
        const alignedOnSegment = (
          a3: InstanceType<typeof THREE.Vector3>,
          b3: InstanceType<typeof THREE.Vector3>
        ) => {
          if (!startPoint || altKey) return null;
          const d = b3.clone().sub(a3);
          const u = a3.clone().sub(startPoint);
          for (const axis of AXES) {
            const dPerp = d.clone().addScaledVector(axis.dir, -d.dot(axis.dir));
            const uPerp = u.clone().addScaledVector(axis.dir, -u.dot(axis.dir));
            const len2 = dPerp.lengthSq();
            if (len2 < 1e-12) continue;
            const t = Math.max(0, Math.min(1, -uPerp.dot(dPerp) / len2));
            if (uPerp.addScaledVector(dPerp, t).length() > alignTolerance) continue;
            return { point: a3.clone().lerp(b3, t), label: axis.label };
          }
          return null;
        };

        const visible = new Set<object>();
        world.meshes.forEach((m) => visible.add(m));
        for (const seg of snapSegments) {
          if (!visible.has(seg.mesh)) continue;
          const a3 = seg.a.clone().applyMatrix4(seg.mesh.matrixWorld);
          const b3 = seg.b.clone().applyMatrix4(seg.mesh.matrixWorld);
          if (project(a3, pa) > 1 || project(b3, pb) > 1) continue;
          // Pré-filtre : segment loin du curseur
          if (
            Math.min(pa.x, pb.x) - 14 > mouseX ||
            Math.max(pa.x, pb.x) + 14 < mouseX ||
            Math.min(pa.y, pb.y) - 14 > mouseY ||
            Math.max(pa.y, pb.y) + 14 < mouseY
          ) {
            continue;
          }
          const dir = b3.clone().sub(a3).normalize();
          const dA = Math.hypot(pa.x - mouseX, pa.y - mouseY);
          const dB = Math.hypot(pb.x - mouseX, pb.y - mouseY);
          if (dA < 12) consider("vertex", dA, a3.clone(), dir);
          if (dB < 12) consider("vertex", dB, b3.clone(), dir);
          const dM = Math.hypot((pa.x + pb.x) / 2 - mouseX, (pa.y + pb.y) / 2 - mouseY);
          if (dM < 10) consider("midpoint", dM, a3.clone().lerp(b3, 0.5), dir);
          const { dist, t } = distToSegment2D(mouseX, mouseY, pa, pb);
          if (dist < 8) consider("edge", dist, a3.clone().lerp(b3, t), dir);
          if (dist < 14) {
            const aligned = alignedOnSegment(a3, b3);
            if (aligned) {
              const px = new THREE.Vector2();
              project(aligned.point, px);
              const d2 = Math.hypot(px.x - mouseX, px.y - mouseY);
              if (d2 < 16) consider("aligned", d2, aligned.point, dir, aligned.label);
            }
          }
        }

        if (!best && faceHit) {
          const normal = faceHit.face
            ? faceHit.face.normal.clone().transformDirection(faceHit.object.matrixWorld)
            : new THREE.Vector3(0, 1, 0);
          best = { kind: "face", dist: 0, point: faceHit.point.clone(), dir: normal };
        }
        return best as Candidate | null;
      };

      /** Aligne le 2e point sur un axe ou sur l'arête de départ. */
      const applyLock = (
        start: InstanceType<typeof THREE.Vector3>,
        point: InstanceType<typeof THREE.Vector3>,
        free: boolean
      ) => {
        lockLabel = null;
        if (free) return point;
        const delta = point.clone().sub(start);
        const len = delta.length();
        if (len < 1e-6) return point;
        const dir = delta.clone().divideScalar(len);
        const candidates = startDir
          ? [...AXES, { dir: startDir.clone(), label: "parallèle à l'arête" }]
          : AXES;
        for (const axis of candidates) {
          if (Math.abs(dir.dot(axis.dir)) > COS_LOCK) {
            lockLabel = axis.label;
            return start.clone().addScaledVector(axis.dir, delta.dot(axis.dir));
          }
        }
        return point;
      };

      // Repère de visée + élastique de mesure
      const snapElement = document.createElement("div");
      snapElement.className = "v3d-snap";
      const snapMark = new OBCF.Mark(world, snapElement);
      snapMark.visible = false;

      // Second repère : les deux bouts de l'arête survolée en mode Cote, sinon
      // le trait se confond avec le contour noir de la planche.
      const edgeEndElement = document.createElement("div");
      edgeEndElement.className = "v3d-snap v3d-snap-vertex";
      const edgeEndMark = new OBCF.Mark(world, edgeEndElement);
      edgeEndMark.visible = false;

      const rubberGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]);
      const rubberMaterial = new THREE.LineDashedMaterial({
        color: new THREE.Color(THEMES[themeRef.current].line),
        dashSize: 0.02,
        gapSize: 0.012,
        depthTest: false,
      });
      const rubber = new THREE.Line(rubberGeometry, rubberMaterial);
      rubber.renderOrder = 999;
      rubber.frustumCulled = false;
      rubber.visible = false;
      world.scene.three.add(rubber);

      const rubberLabelElement = document.createElement("div");
      rubberLabelElement.className = "v3d-live-label";
      const rubberLabel = new OBCF.Mark(world, rubberLabelElement);
      rubberLabel.visible = false;

      const formatLength = (meters: number) =>
        OBCF.SimpleDimensionLine.units === "cm"
          ? `${(meters * 100).toFixed(1)} cm`
          : `${meters.toFixed(2)} m`;

      let altKey = false;

      const updatePreview = (clientX: number, clientY: number) => {
        const snap = computeSnap(clientX, clientY);
        if (!snap) {
          snapKind = null;
          snapMark.visible = false;
          rubber.visible = false;
          rubberLabel.visible = false;
          setSnapHint(null);
          return;
        }
        let point = snap.point;
        if (startPoint) {
          if (snap.lock) lockLabel = snap.lock;
          else point = applyLock(startPoint, snap.point, altKey);
        }
        snapPoint.copy(point);
        snapDir.copy(snap.dir);
        snapKind = snap.kind;
        snapElement.className = `v3d-snap v3d-snap-${snap.kind}`;
        snapMark.three.position.copy(point);
        snapMark.visible = true;
        setSnapHint(startPoint && lockLabel ? `${SNAP_LABELS[snap.kind]} · ${lockLabel}` : SNAP_LABELS[snap.kind]);

        if (startPoint) {
          const positions = rubberGeometry.getAttribute("position");
          positions.setXYZ(0, startPoint.x, startPoint.y, startPoint.z);
          positions.setXYZ(1, point.x, point.y, point.z);
          positions.needsUpdate = true;
          rubberGeometry.computeBoundingSphere();
          rubber.computeLineDistances();
          rubber.visible = true;
          rubberLabelElement.textContent = formatLength(startPoint.distanceTo(point));
          rubberLabel.three.position.copy(startPoint.clone().lerp(point, 0.5));
          rubberLabel.visible = true;
        }
      };

      const resetMeasure = () => {
        startPoint = null;
        startDir = null;
        lockLabel = null;
        rubber.visible = false;
        rubberLabel.visible = false;
      };

      const hideSnap = () => {
        snapMark.visible = false;
        edgeEndMark.visible = false;
        setSnapHint(null);
      };

      // ── Cote d'arête ────────────────────────────────────────────────────
      // L'outil de la lib mesurait les arêtes du triangle survolé, diagonales
      // de triangulation comprises : sur un panneau de 180 × 15 mm elle
      // affichait 18,1 cm (√(18² + 1,5²) = 18,06) au lieu de 18,0. On ne
      // propose donc que les arêtes réelles du modèle — exactement celles que
      // le viewer dessine en contour.
      let hoveredEdge: { a: InstanceType<typeof THREE.Vector3>; b: InstanceType<typeof THREE.Vector3> } | null = null;

      const findEdge = (clientX: number, clientY: number) => {
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
        ndc.x = (mouseX / rect.width) * 2 - 1;
        ndc.y = -(mouseY / rect.height) * 2 + 1;
        raycaster.setFromCamera(ndc, world.camera.three);
        const pickable: InstanceType<typeof THREE.Mesh>[] = [];
        world.meshes.forEach((m) => pickable.push(m as never));
        const faceHit = raycaster.intersectObjects(pickable, false)[0];
        const camPos = world.camera.three.position;
        const depthTolerance = focus.radius * 0.03;

        let best: { a: InstanceType<typeof THREE.Vector3>; b: InstanceType<typeof THREE.Vector3>; dist: number } | null = null;
        const visible = new Set<object>();
        world.meshes.forEach((m) => visible.add(m));
        for (const seg of snapSegments) {
          if (!visible.has(seg.mesh)) continue;
          const a3 = seg.a.clone().applyMatrix4(seg.mesh.matrixWorld);
          const b3 = seg.b.clone().applyMatrix4(seg.mesh.matrixWorld);
          if (project(a3, pa) > 1 || project(b3, pb) > 1) continue;
          if (
            Math.min(pa.x, pb.x) - 12 > mouseX ||
            Math.max(pa.x, pb.x) + 12 < mouseX ||
            Math.min(pa.y, pb.y) - 12 > mouseY ||
            Math.max(pa.y, pb.y) + 12 < mouseY
          ) {
            continue;
          }
          const { dist, t } = distToSegment2D(mouseX, mouseY, pa, pb);
          if (dist > 10) continue;
          const middle = a3.clone().lerp(b3, t);
          if (faceHit && camPos.distanceTo(middle) > faceHit.distance + depthTolerance) continue;
          if (!best || dist < best.dist) best = { a: a3, b: b3, dist };
        }
        return best;
      };

      const updateEdgePreview = (clientX: number, clientY: number) => {
        const found = findEdge(clientX, clientY);
        hoveredEdge = found ? { a: found.a, b: found.b } : null;
        if (!found) {
          rubber.visible = false;
          rubberLabel.visible = false;
          snapMark.visible = false;
          edgeEndMark.visible = false;
          setSnapHint(null);
          return;
        }
        snapElement.className = "v3d-snap v3d-snap-vertex";
        snapMark.three.position.copy(found.a);
        snapMark.visible = true;
        edgeEndMark.three.position.copy(found.b);
        edgeEndMark.visible = true;
        const positions = rubberGeometry.getAttribute("position");
        positions.setXYZ(0, found.a.x, found.a.y, found.a.z);
        positions.setXYZ(1, found.b.x, found.b.y, found.b.z);
        positions.needsUpdate = true;
        rubberGeometry.computeBoundingSphere();
        rubber.computeLineDistances();
        rubber.visible = true;
        rubberLabelElement.textContent = formatLength(found.a.distanceTo(found.b));
        rubberLabel.three.position.copy(found.a.clone().lerp(found.b, 0.5));
        rubberLabel.visible = true;
        setSnapHint("arête du modèle");
      };

      // Clic = placer un point de mesure — sauf si on vient d'orbiter (drag)
      let downX = 0;
      let downY = 0;
      const onPointerDown = (e: PointerEvent) => {
        downX = e.clientX;
        downY = e.clientY;
      };
      const onPointerMove = (e: PointerEvent) => {
        altKey = e.altKey;
        if (modeRef.current === "length") updatePreview(e.clientX, e.clientY);
        else if (modeRef.current === "edge") updateEdgePreview(e.clientX, e.clientY);
        else if (modeRef.current === "interact") {
          setSnapHint(pickMovable(e.clientX, e.clientY)?.label ?? null);
        }
      };
      const onPointerLeave = () => hideSnap();
      // Double-clic : on recentre l'orbite sur le point visé sans bouger la
      // caméra — c'est ce qui permet de zoomer très près d'un détail au lieu
      // de plonger vers le centre du meuble.
      const onDoubleClick = (e: MouseEvent) => {
        ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(ndc, world.camera.three);
        const pickable: InstanceType<typeof THREE.Mesh>[] = [];
        world.meshes.forEach((m) => pickable.push(m as never));
        const hit = raycaster.intersectObjects(pickable, false)[0];
        if (!hit) return;
        controls.setOrbitPoint(hit.point.x, hit.point.y, hit.point.z);
      };
      const onClick = (e: MouseEvent) => {
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
        if (modeRef.current === "interact") {
          const hit = pickMovable(e.clientX, e.clientY);
          if (hit) {
            hit.target = hit.target > 0.5 ? 0 : 1;
            animateMovables();
          }
          return;
        }
        if (modeRef.current === "edge") {
          if (hoveredEdge) length.createOnPoints(hoveredEdge.a.clone(), hoveredEdge.b.clone());
          return;
        }
        if (modeRef.current !== "length" || !snapKind) return;
        if (!startPoint) {
          startPoint = snapPoint.clone();
          startDir = snapKind === "edge" || snapKind === "vertex" || snapKind === "midpoint" ? snapDir.clone() : null;
        } else {
          length.createOnPoints(startPoint.clone(), snapPoint.clone());
          resetMeasure();
        }
        updatePreview(e.clientX, e.clientY);
      };
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Alt") altKey = true;
        if (e.key === "Escape") {
          resetMeasure();
          length.cancelCreation();
        }
      };
      const onKeyUp = (e: KeyboardEvent) => {
        if (e.key === "Alt") altKey = false;
      };
      container.addEventListener("pointerdown", onPointerDown);
      container.addEventListener("pointermove", onPointerMove);
      container.addEventListener("pointerleave", onPointerLeave);
      container.addEventListener("click", onClick);
      container.addEventListener("dblclick", onDoubleClick);
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      window.addEventListener("scroll", refreshRect, true);

      // Le renderer se redimensionne, mais l'aspect de la caméra ne suit pas
      // tout seul : sans ça le modèle est étiré dès que le conteneur n'a pas
      // les proportions qu'il avait au chargement (cas d'une leçon VBA, plus
      // large et moins haute que la page admin). Le premier passage recadre,
      // une fois que le conteneur a sa taille définitive.
      let firstResize = true;
      const resizeObserver = new ResizeObserver(() => {
        world.renderer?.resize();
        world.camera.updateAspect();
        refreshRect();
        if (firstResize) {
          firstResize = false;
          frame(false);
        }
      });
      resizeObserver.observe(container);

      // ── Vue éclatée ─────────────────────────────────────────────────────
      // Chaque composant terminal s'écarte du centre proportionnellement à sa
      // position : on voit comment l'ensemble est assemblé.
      const explodeCenter = fullBox.getCenter(new THREE.Vector3());
      const explodeParts: {
        node: InstanceType<typeof THREE.Object3D>;
        delta: InstanceType<typeof THREE.Vector3>;
      }[] = [];
      const collectLeaves = (nodes: PartNode[]) => {
        for (const node of nodes) {
          if (node.children.length) {
            collectLeaves(node.children);
            continue;
          }
          const object = partObjects[node.id];
          const center = new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());
          explodeParts.push({ node: object, delta: center.sub(explodeCenter) });
        }
      };
      collectLeaves(partTree);

      // ── Ouvrants (portes, trappes, tiroirs) ─────────────────────────────
      // SketchUp n'exporte aucune animation : on la déduit de la structure.
      // Un composant dont le nom commence par Porte/Portière/Trappe/Abattant
      // pivote, un Tiroir coulisse. La charnière n'a pas besoin d'être nommée :
      // elle est prise à l'opposé de la poignée (le petit volume du composant),
      // ce qui donne le bon côté aussi bien pour un vantail que pour un abattant.
      const MOVABLE = /^(porte|porti[eè]re|trappe|abattant|tiroir)/i;
      // Chaque ouvrant garde son propre état d'ouverture : un meuble peut en
      // compter plusieurs et on les manipule un par un à la souris.
      const movables: {
        node: InstanceType<typeof THREE.Object3D>;
        label: string;
        pivot: InstanceType<typeof THREE.Vector3>;
        axis: InstanceType<typeof THREE.Vector3>;
        angle: number;
        slide: InstanceType<typeof THREE.Vector3> | null;
        meshes: Set<object>;
        value: number;
        target: number;
      }[] = [];

      /** Les meshes appartenant à un ouvrant, pour savoir sur quoi on a cliqué. */
      const ownMeshes = (object: InstanceType<typeof THREE.Object3D>) => {
        const set = new Set<object>();
        object.traverse((child) => {
          if ((child as { isMesh?: boolean }).isMesh) set.add(child);
        });
        return set;
      };

      const buildMovable = (object: InstanceType<typeof THREE.Object3D>, label: string) => {
        const meshParts: { box: InstanceType<typeof THREE.Box3>; volume: number }[] = [];
        object.traverse((child) => {
          if (!(child as { isMesh?: boolean }).isMesh) return;
          const box = new THREE.Box3().setFromObject(child);
          const size = box.getSize(new THREE.Vector3());
          meshParts.push({ box, volume: size.x * size.y * size.z });
        });
        if (!meshParts.length) return;
        meshParts.sort((a, b) => b.volume - a.volume);
        const panel = meshParts[0].box;
        const panelSize = panel.getSize(new THREE.Vector3());
        const panelCenter = panel.getCenter(new THREE.Vector3());
        const modelCenter = fullBox.getCenter(new THREE.Vector3());

        // Axe le plus mince du panneau = sa normale ; les deux autres sont dans
        // son plan et portent les charnières possibles.
        const dims = [panelSize.x, panelSize.y, panelSize.z];
        const thin = dims.indexOf(Math.min(...dims));
        const inPlane = [0, 1, 2].filter((a) => a !== thin);
        const outward = new THREE.Vector3();
        outward.setComponent(thin, Math.sign(panelCenter.getComponent(thin) - modelCenter.getComponent(thin)) || 1);

        if (/^tiroir/i.test(label)) {
          // Un tiroir sort par la face du meuble dont il est le plus proche.
          // (Y est la verticale après conversion : on ne teste que X et Z.)
          const whole = new THREE.Box3().setFromObject(object);
          const center = whole.getCenter(new THREE.Vector3());
          let bestAxis = 0;
          let bestSign = 1;
          let bestGap = Infinity;
          for (const a of [0, 2]) {
            for (const sign of [-1, 1]) {
              const gap =
                sign < 0
                  ? whole.min.getComponent(a) - fullBox.min.getComponent(a)
                  : fullBox.max.getComponent(a) - whole.max.getComponent(a);
              if (gap < bestGap) {
                bestGap = gap;
                bestAxis = a;
                bestSign = sign;
              }
            }
          }
          const size = whole.getSize(new THREE.Vector3());
          const slide = new THREE.Vector3().setComponent(
            bestAxis,
            bestSign * size.getComponent(bestAxis) * 0.7
          );
          movables.push({ node: object, label, pivot: center, axis: outward.clone(), angle: 0, slide, meshes: ownMeshes(object), value: 0, target: 0 });
          return;
        }

        // La poignée : le plus petit volume, s'il est nettement plus petit.
        const handle =
          meshParts.length > 1 && meshParts[meshParts.length - 1].volume < meshParts[0].volume * 0.2
            ? meshParts[meshParts.length - 1].box.getCenter(new THREE.Vector3())
            : null;

        // Quatre charnières candidates : les quatre arêtes du panneau. On garde
        // celle qui est la plus loin de la poignée (sinon : arête basse).
        let bestAxisIndex = inPlane[0];
        let bestSign = -1;
        let bestScore = -Infinity;
        for (const along of inPlane) {
          const across = inPlane.find((a) => a !== along) as number;
          for (const sign of [-1, 1]) {
            const edgeCoord = sign < 0 ? panel.min.getComponent(across) : panel.max.getComponent(across);
            const reference = handle ?? panelCenter.clone().setComponent(across, panel.max.getComponent(across));
            const score = Math.abs(reference.getComponent(across) - edgeCoord);
            if (score > bestScore) {
              bestScore = score;
              bestAxisIndex = along;
              bestSign = sign;
            }
          }
        }
        const across = inPlane.find((a) => a !== bestAxisIndex) as number;
        const axis = new THREE.Vector3().setComponent(bestAxisIndex, 1);
        const pivot = panelCenter.clone();
        pivot.setComponent(across, bestSign < 0 ? panel.min.getComponent(across) : panel.max.getComponent(across));

        // Sens d'ouverture : le bord libre doit partir vers l'extérieur.
        const free = panelCenter.clone().sub(pivot);
        const rotated = free.clone().applyAxisAngle(axis, 0.2);
        const angle = rotated.sub(free).dot(outward) > 0 ? 1.65 : -1.65;
        movables.push({ node: object, label, pivot, axis, angle, slide: null, meshes: ownMeshes(object), value: 0, target: 0 });
      };

      const collectMovables = (nodes: PartNode[]) => {
        for (const node of nodes) {
          if (MOVABLE.test(node.name)) buildMovable(partObjects[node.id], node.name);
          else collectMovables(node.children);
        }
      };
      collectMovables(partTree);

      let explodeValue = 0;
      let explodeTarget = 0;
      let explodeRaf = 0;
      /** Quel ouvrant se trouve sous le curseur ? */
      const pickMovable = (clientX: number, clientY: number) => {
        if (!movables.length) return null;
        ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(ndc, world.camera.three);
        const pickable: InstanceType<typeof THREE.Mesh>[] = [];
        world.meshes.forEach((m) => pickable.push(m as never));
        const hit = raycaster.intersectObjects(pickable, false)[0];
        if (!hit) return null;
        return movables.find((m) => m.meshes.has(hit.object)) ?? null;
      };

      let openRaf = 0;
      /** Anime tous les ouvrants vers leur cible respective. */
      const animateMovables = () => {
        cancelAnimationFrame(openRaf);
        const step = () => {
          let moving = false;
          for (const movable of movables) {
            const diff = movable.target - movable.value;
            if (Math.abs(diff) < 0.004) {
              movable.value = movable.target;
              continue;
            }
            movable.value += diff * 0.14;
            moving = true;
          }
          applyTransforms();
          if (moving) openRaf = requestAnimationFrame(step);
          else updateFocus();
        };
        openRaf = requestAnimationFrame(step);
      };

      const explodeDelta = new Map(explodeParts.map((p) => [p.node, p.delta]));
      const applyTransforms = () => {
        for (const part of explodeParts) {
          if (movables.some((m) => m.node === part.node)) continue;
          part.node.position.copy(part.delta).multiplyScalar(explodeValue);
        }
        // Les ouvrants combinent l'éclatement et leur rotation propre : on
        // compose la matrice à la main plutôt que d'empiler position/rotation.
        for (const movable of movables) {
          const delta = explodeDelta.get(movable.node);
          const matrix = new THREE.Matrix4();
          if (delta) {
            matrix.makeTranslation(
              delta.x * explodeValue,
              delta.y * explodeValue,
              delta.z * explodeValue
            );
          }
          if (movable.slide) {
            matrix.multiply(
              new THREE.Matrix4().makeTranslation(
                movable.slide.x * movable.value,
                movable.slide.y * movable.value,
                movable.slide.z * movable.value
              )
            );
          } else {
            const p = movable.pivot;
            matrix
              .multiply(new THREE.Matrix4().makeTranslation(p.x, p.y, p.z))
              .multiply(new THREE.Matrix4().makeRotationAxis(movable.axis, movable.angle * movable.value))
              .multiply(new THREE.Matrix4().makeTranslation(-p.x, -p.y, -p.z));
          }
          movable.node.matrixAutoUpdate = false;
          movable.node.matrix.copy(matrix);
        }
        model.updateMatrixWorld(true);
      };
      const applyExplode = (factor: number) => {
        explodeValue = factor;
        applyTransforms();
      };

      handles = {
        // Changer d'outil remet toujours l'aperçu à zéro : mètre et cote
        // partagent l'élastique et l'étiquette de mesure en direct.
        setMode() {
          resetMeasure();
          hideSnap();
          hoveredEdge = null;
        },
        setUnits(u) {
          OBCF.SimpleDimensionLine.units = u;
          OBCF.SimpleDimensionLine.scale = u === "cm" ? 0.01 : 1;
          OBCF.SimpleDimensionLine.rounding = u === "cm" ? 1 : 2;
          // Réassigner le point final force le recalcul de l'étiquette
          for (const dim of length.list) dim.endPoint = dim.endPoint.clone();
        },
        setTheme(t) {
          applyTheme(t);
          rubberMaterial.color = new THREE.Color(THEMES[t].line);
        },
        /** Bascule l'ouvrant sous le curseur ; renvoie son nom, ou null. */
        toggleMovableAt(clientX, clientY) {
          const hit = pickMovable(clientX, clientY);
          if (!hit) return null;
          hit.target = hit.target > 0.5 ? 0 : 1;
          animateMovables();
          return hit.label;
        },
        movableAt(clientX, clientY) {
          return pickMovable(clientX, clientY)?.label ?? null;
        },
        setExplode(target, refit) {
          explodeTarget = target;
          cancelAnimationFrame(explodeRaf);
          const step = () => {
            const diff = explodeTarget - explodeValue;
            if (Math.abs(diff) < 0.003) {
              explodeValue = explodeTarget;
              applyExplode(explodeValue);
              updateFocus();
              if (refit) controls.fitToSphere(focus, true);
              return;
            }
            explodeValue += diff * 0.16;
            applyExplode(explodeValue);
            updateFocus();
            explodeRaf = requestAnimationFrame(step);
          };
          explodeRaf = requestAnimationFrame(step);
          resetMeasure();
          hideSnap();
        },
        setEdges(visible) {
          for (const line of outlines) line.visible = visible;
        },
        setHidden(ids) {
          const hiddenIds = new Set(ids);
          partObjects.forEach((obj, id) => {
            obj.visible = !hiddenIds.has(id);
          });
          syncPickable();
          updateFocus();
        },
        // Recadre sur ce qui reste visible sans changer l'angle de vue
        // (utilisé après une isolation, pour ne pas désorienter).
        frameVisible() {
          updateFocus();
          controls.fitToSphere(focus, true);
        },
        recenter() {
          frame(true);
        },
        clear() {
          length.deleteAll();
          resetMeasure();
        },
        dispose() {
          cancelAnimationFrame(explodeRaf);
          cancelAnimationFrame(openRaf);
          resizeObserver.disconnect();
          container.removeEventListener("pointerdown", onPointerDown);
          container.removeEventListener("pointermove", onPointerMove);
          container.removeEventListener("pointerleave", onPointerLeave);
          container.removeEventListener("dblclick", onDoubleClick);
          container.removeEventListener("click", onClick);
          window.removeEventListener("keydown", onKeyDown);
          window.removeEventListener("keyup", onKeyUp);
          window.removeEventListener("scroll", refreshRect, true);
          snapMark.dispose();
          edgeEndMark.dispose();
          rubberLabel.dispose();
          rubberGeometry.dispose();
          rubberMaterial.dispose();
          components.dispose();
          container.innerHTML = "";
        },
      };
      handlesRef.current = handles;

      setTree(partTree);
      setHidden(new Set());
      setOpen(new Set());
      setSize([dims.x, dims.y, dims.z]);
      setMovableCount(movables.length);
      setStatus("ready");
    })().catch((err) => {
      console.error("[Van3DViewer]", err);
      if (!disposed) setStatus("error");
    });

    return () => {
      disposed = true;
      handles?.dispose();
      handlesRef.current = null;
    };
  }, [src]);

  const setMode = (m: Mode) => {
    modeRef.current = m;
    setModeState(m);
    handlesRef.current?.setMode(m);
  };

  const setUnits = (u: Units) => {
    setUnitsState(u);
    handlesRef.current?.setUnits(u);
  };

  const toggleTheme = () => {
    const next: Theme = themeRef.current === "light" ? "dark" : "light";
    themeRef.current = next;
    setThemeState(next);
    handlesRef.current?.setTheme(next);
  };

  const toggleEdges = () => {
    setEdgesState((prev) => {
      handlesRef.current?.setEdges(!prev);
      return !prev;
    });
  };

  const toggleExplode = () => {
    const next = explode > 0 ? 0 : 0.7;
    setExplodeState(next);
    handlesRef.current?.setExplode(next, true);
  };

  const slideExplode = (value: number) => {
    setExplodeState(value);
    handlesRef.current?.setExplode(value, false);
  };

  // ── Isolation des composants ──────────────────────────────────────────────
  const flat = (nodes: PartNode[]): PartNode[] =>
    nodes.flatMap((n) => [n, ...flat(n.children)]);
  const allNodes = flat(tree);

  const applyHidden = (next: Set<number>) => {
    setHidden(next);
    handlesRef.current?.setHidden(Array.from(next));
  };

  const togglePart = (id: number) => {
    const next = new Set(hidden);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    applyHidden(next);
  };

  /** Chemin des ancêtres d'un nœud, de la racine à son parent direct. */
  const ancestorsOf = (
    nodes: PartNode[],
    id: number,
    path: PartNode[] = []
  ): PartNode[] | null => {
    for (const node of nodes) {
      if (node.id === id) return path;
      const found = ancestorsOf(node.children, id, [...path, node]);
      if (found) return found;
    }
    return null;
  };

  /** Isole un composant (ses parents et ses enfants restent visibles). */
  const isolatePart = (node: PartNode) => {
    const keep = new Set<number>([
      node.id,
      ...(ancestorsOf(tree, node.id) ?? []).map((n) => n.id),
      ...flat(node.children).map((n) => n.id),
    ]);
    const next = new Set(allNodes.map((n) => n.id).filter((id) => !keep.has(id)));
    const alreadyIsolated =
      next.size === hidden.size && Array.from(next).every((id) => hidden.has(id));
    applyHidden(alreadyIsolated ? new Set() : next);
    handlesRef.current?.frameVisible();
  };

  const toggleOpen = (id: number) => {
    const next = new Set(open);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpen(next);
  };

  // ── Styles dépendants du thème ────────────────────────────────────────────
  const panel = isLight
    ? "bg-white/85 ring-1 ring-black/5 shadow-sm"
    : "bg-black/50";

  // Tout est en pilule pour répondre aux angles arrondis du cadre du viewer ;
  // le doré actif porte du blanc, d'où le dégradé volontairement assombri.
  const btn = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#B9945F] focus-visible:ring-offset-1 ${
      active
        ? "bg-gradient-to-br from-[#A8834E] to-[#C9A96A] text-white shadow-sm"
        : isLight
          ? "text-slate-600 hover:bg-black/5"
          : "bg-white/10 text-white/80 hover:bg-white/20"
    }`;
  const divider = `mx-0.5 h-4 w-px ${isLight ? "bg-black/10" : "bg-white/20"}`;

  const fmt = (m: number) =>
    units === "cm" ? `${Math.round(m * 100)}` : (Math.round(m * 100) / 100).toFixed(2);

  return (
    <div
      className={`van3d-viewer relative overflow-hidden rounded-2xl border ${
        isLight ? "border-black/10" : "border-white/10"
      } ${className}`}
      style={{ backgroundColor: palette.bg }}
    >
      {/* Repères de mesure de That Open : un carré rouge de 15 px pour la visée
          et des pastilles noires de 16 px aux extrémités — trop gros pour viser
          un coin. On les remplace par une cible fine et un point net. Les
          styles de la lib étant inline, il faut !important (et cibler les
          extrémités par leur style : ce sont les mêmes divs que l'étiquette,
          mais vides, d'où le :empty). Insertion en HTML brut : React échappe
          les quotes dans un <style>, ce qui casse le sélecteur et l'hydratation. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .van3d-viewer .default-vertex-picker {
          width: 11px !important; height: 11px !important;
          border: 1.5px solid ${palette.accent} !important;
          border-radius: 9999px !important;
          background: radial-gradient(circle, ${palette.accent} 0 1.6px, transparent 2px) !important;
          box-shadow: 0 0 0 1px rgba(255,255,255,.9) !important;
        }
        .van3d-viewer div[style*="border-radius: 8px"]:empty {
          width: 9px !important; height: 9px !important; padding: 0 !important;
          border-radius: 9999px !important;
          background-color: ${palette.accent} !important;
          box-shadow: 0 0 0 1.5px #fff, 0 0 0 2.5px rgba(0,0,0,.2) !important;
        }
        /* Repère d'accrochage maison : la forme dit à quoi on s'accroche
           (sommet plein, milieu en losange, arête en cercle creux, face en
           croix), comme les inférences de SketchUp. */
        .van3d-viewer .v3d-snap {
          width: 11px; height: 11px; box-sizing: border-box;
          border: 2px solid ${palette.accent};
          background: rgba(255,255,255,.55);
          box-shadow: 0 0 0 1px rgba(255,255,255,.85);
        }
        .van3d-viewer .v3d-snap-vertex {
          border-radius: 9999px;
          background: ${palette.accent};
        }
        .van3d-viewer .v3d-snap-midpoint {
          transform: rotate(45deg);
          background: ${palette.accent};
        }
        .van3d-viewer .v3d-snap-edge { border-radius: 9999px; }
        /* Point aligné sur un axe avec le 1er point de la mesure */
        .van3d-viewer .v3d-snap-aligned {
          border-radius: 9999px;
          border-color: #e08b2f;
          background: #e08b2f;
          box-shadow: 0 0 0 3px rgba(224,139,47,.3);
        }
        .van3d-viewer .v3d-snap-face {
          width: 13px; height: 13px; border: none; background: none;
          box-shadow: none;
          background-image:
            linear-gradient(${palette.accent}, ${palette.accent}),
            linear-gradient(${palette.accent}, ${palette.accent});
          background-size: 13px 1.5px, 1.5px 13px;
          background-position: center, center;
          background-repeat: no-repeat;
        }
        .van3d-viewer .v3d-live-label {
          background: ${palette.accent}; color: #fff;
          font: 500 11px/1 ui-sans-serif, system-ui, sans-serif;
          padding: 4px 9px; border-radius: 9999px; white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,.25);
        }
      `,
        }}
      />

      <div
        ref={containerRef}
        className={`absolute inset-0 ${
          mode === "orbit"
            ? "cursor-grab active:cursor-grabbing"
            : mode === "interact"
              ? "cursor-pointer"
              : "cursor-crosshair"
        }`}
      />

      {/* Barre d'outils */}
      <div
        className={`absolute left-3 top-3 z-10 flex flex-wrap items-center gap-1 rounded-2xl p-1.5 backdrop-blur-md ${panel}`}
      >
        <button type="button" className={btn(mode === "orbit")} onClick={() => setMode("orbit")} title="Naviguer autour du meuble">
          <IconOrbit />
          <span className="hidden sm:inline">Naviguer</span>
        </button>
        <button type="button" className={btn(mode === "length")} onClick={() => setMode("length")} title="Mesurer entre deux points">
          <IconRuler />
          <span className="hidden sm:inline">Mètre</span>
        </button>
        <button type="button" className={btn(mode === "edge")} onClick={() => setMode("edge")} title="Coter une arête au survol">
          <IconDimension />
          <span className="hidden sm:inline">Cote</span>
        </button>
        {movableCount > 0 && (
          <button
            type="button"
            className={btn(mode === "interact")}
            onClick={() => setMode("interact")}
            title={`Interagir : cliquer un ouvrant pour l'ouvrir ou le fermer (${movableCount} sur ce plan)`}
          >
            <IconInteract />
            <span className="hidden sm:inline">Interagir</span>
          </button>
        )}

        <div className={divider} />

        <button type="button" className={btn(false)} onClick={() => handlesRef.current?.recenter()} title="Recentrer la vue sur le meuble">
          <IconTarget />
        </button>
        <button type="button" className={btn(edges)} onClick={toggleEdges} title="Afficher les contours des planches">
          <IconEdges />
        </button>
        <button
          type="button"
          className={btn(explode > 0)}
          onClick={toggleExplode}
          title="Vue éclatée : écarter toutes les pièces pour voir l'assemblage"
        >
          <IconExplode />
        </button>
        {explode > 0 && (
          <input
            type="range"
            min={0.05}
            max={1.6}
            step={0.05}
            value={explode}
            onChange={(e) => slideExplode(Number(e.target.value))}
            // Recadre une fois le curseur relâché : sinon les pièces les plus
            // écartées sortent du champ.
            onPointerUp={() => handlesRef.current?.frameVisible()}
            onKeyUp={() => handlesRef.current?.frameVisible()}
            title="Écartement des pièces"
            aria-label="Écartement des pièces"
            className="mx-1 h-1 w-20 cursor-pointer accent-[#B9945F]"
          />
        )}
        <button type="button" className={btn(false)} onClick={toggleTheme} title={isLight ? "Fond sombre" : "Fond clair"}>
          {isLight ? <IconMoon /> : <IconSun />}
        </button>

        <div className={divider} />

        <button
          type="button"
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors outline-none hover:bg-red-500/80 hover:text-white focus-visible:ring-2 focus-visible:ring-[#B9945F] ${
            isLight ? "text-slate-600" : "bg-white/10 text-white/80"
          }`}
          onClick={() => handlesRef.current?.clear()}
          title="Effacer les mesures"
        >
          <IconEraser />
        </button>
      </div>

      {/* Encombrement du modèle + unités */}
      <div className={`absolute bottom-3 right-3 z-10 flex items-center gap-2 rounded-2xl p-1.5 backdrop-blur-md ${panel}`}>
        {size && (
          <span className={`pl-1.5 text-[11px] tabular-nums ${isLight ? "text-slate-500" : "text-white/60"}`}>
            {fmt(size[0])} × {fmt(size[2])} × {fmt(size[1])} {units}
          </span>
        )}
        {(["cm", "m"] as Units[]).map((u) => (
          <button key={u} type="button" className={btn(units === u)} onClick={() => setUnits(u)}>
            {u}
          </button>
        ))}
      </div>

      {/* Panneau composants */}
      {tree.length > 0 && (
        <div className={`absolute right-2 top-[3.75rem] z-10 w-48 rounded-2xl p-2.5 sm:right-3 sm:top-[4.25rem] sm:w-64 sm:p-3 backdrop-blur-md ${panel}`}>
          <button
            type="button"
            className={`flex w-full items-center justify-between gap-2 rounded-lg text-xs font-semibold uppercase tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-[#B9945F] ${
              isLight ? "text-slate-500 hover:text-slate-700" : "text-white/70 hover:text-white"
            }`}
            onClick={() => setShowParts((s) => !s)}
          >
            <span>
              Pièces{" "}
              <span className={isLight ? "text-slate-400" : "text-white/40"}>
                ({allNodes.length})
              </span>
            </span>
            <IconChevron open={showParts} down />
          </button>

          {showParts && (
            <>
              {hidden.size > 0 && (
                <button
                  type="button"
                  className="mt-1.5 rounded-full text-[11px] font-semibold text-[#8A6A3C] hover:underline"
                  onClick={() => applyHidden(new Set())}
                >
                  Tout réafficher
                </button>
              )}
              <ul className="mt-2 max-h-72 space-y-0.5 overflow-y-auto pr-1">
                <PartBranch
                  nodes={tree}
                  isLight={isLight}
                  hidden={hidden}
                  open={open}
                  onToggle={togglePart}
                  onIsolate={isolatePart}
                  onOpen={toggleOpen}
                />
              </ul>
            </>
          )}
        </div>
      )}

      {/* Aide contextuelle */}
      <div
        className={`pointer-events-none absolute bottom-3 left-1/2 z-10 hidden max-w-[min(56%,30rem)] -translate-x-1/2 rounded-full px-4 py-1.5 text-center text-xs backdrop-blur-md sm:block ${
          isLight ? "bg-white/85 text-slate-600 ring-1 ring-black/5" : "bg-black/60 text-white/80"
        }`}
      >
        {snapHint && (mode === "length" || mode === "interact") ? (
          <>
            <span className="font-semibold" style={{ color: palette.accent }}>
              {snapHint}
            </span>
            <span className="opacity-60">
              {mode === "length" ? " · clic pour poser · Alt : libre" : " · clic pour ouvrir ou fermer"}
            </span>
          </>
        ) : (
          HINTS[mode]
        )}
      </div>

      {/* États chargement / erreur */}
      {status === "loading" && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center"
          style={{ backgroundColor: palette.bg }}
        >
          <div className={`flex flex-col items-center gap-3 ${isLight ? "text-slate-500" : "text-white/70"}`}>
            <div
              className={`h-8 w-8 animate-spin rounded-full border-2 ${
                isLight ? "border-black/10" : "border-white/20"
              }`}
              style={{ borderTopColor: palette.accent }}
            />
            <span className="text-sm">Chargement du plan 3D…</span>
          </div>
        </div>
      )}
      {status === "error" && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center"
          style={{ backgroundColor: palette.bg }}
        >
          <p className={`max-w-sm text-center text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>
            Impossible de charger le plan 3D. Vérifiez que le fichier{" "}
            <code className="text-white/90">{src}</code> existe.
          </p>
        </div>
      )}
    </div>
  );
}

/** Rend une branche de l'arbre des composants, à n'importe quelle profondeur. */
function PartBranch({
  nodes,
  isLight,
  hidden,
  open,
  onToggle,
  onIsolate,
  onOpen,
}: {
  nodes: PartNode[];
  isLight: boolean;
  hidden: Set<number>;
  open: Set<number>;
  onToggle: (id: number) => void;
  onIsolate: (node: PartNode) => void;
  onOpen: (id: number) => void;
}) {
  return (
    <>
      {nodes.map((node) => (
        <li key={node.id}>
          <PartRow
            node={node}
            isLight={isLight}
            hidden={hidden.has(node.id)}
            open={open.has(node.id)}
            onToggle={() => onToggle(node.id)}
            onIsolate={() => onIsolate(node)}
            onOpen={node.children.length ? () => onOpen(node.id) : undefined}
          />
          {node.children.length > 0 && open.has(node.id) && (
            <ul className={`ml-3 border-l pl-2 ${isLight ? "border-black/10" : "border-white/15"}`}>
              <PartBranch
                nodes={node.children}
                isLight={isLight}
                hidden={hidden}
                open={open}
                onToggle={onToggle}
                onIsolate={onIsolate}
                onOpen={onOpen}
              />
            </ul>
          )}
        </li>
      ))}
    </>
  );
}

/** Une ligne du panneau « Aménagements » : visibilité, dépliage, isolation. */
function PartRow({
  node,
  isLight,
  hidden,
  open,
  onToggle,
  onIsolate,
  onOpen,
}: {
  node: PartNode;
  isLight: boolean;
  hidden: boolean;
  open: boolean;
  onToggle: () => void;
  onIsolate: () => void;
  onOpen?: () => void;
}) {
  return (
    <div
      className={`group flex items-center gap-1.5 rounded-lg px-1.5 py-1 ${
        isLight ? "hover:bg-black/5" : "hover:bg-white/10"
      }`}
    >
      <input
        type="checkbox"
        checked={!hidden}
        onChange={onToggle}
        title={hidden ? "Afficher" : "Masquer"}
        className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-[#B9945F]"
      />
      {/* Toute la ligne déplie : viser le chevron seul était trop fin. */}
      <button
        type="button"
        onClick={onOpen}
        disabled={!onOpen}
        title={onOpen ? (open ? "Replier" : "Voir le détail") : undefined}
        className={`flex min-w-0 flex-1 items-center gap-1 text-left ${onOpen ? "cursor-pointer" : "cursor-default"}`}
      >
        <span className={`shrink-0 ${onOpen ? (isLight ? "text-slate-400" : "text-white/50") : "opacity-0"}`}>
          <IconChevron open={open} />
        </span>
        <span
          className={`truncate text-xs ${
            hidden
              ? isLight
                ? "text-slate-400 line-through"
                : "text-white/40 line-through"
              : isLight
                ? "text-slate-700"
                : "text-white/90"
          }`}
          title={node.name}
        >
          {node.name}
        </span>
      </button>
      {/* Visible en permanence : au doigt, un bouton qui n'apparaît qu'au
          survol est introuvable. */}
      <button
        type="button"
        onClick={onIsolate}
        title="Isoler ce composant"
        className={`shrink-0 rounded-full p-1 opacity-50 transition-opacity hover:opacity-100 group-hover:opacity-100 ${
          isLight ? "text-slate-500 hover:bg-black/10" : "text-white/70 hover:bg-white/20"
        }`}
      >
        <IconFocus />
      </button>
    </div>
  );
}
