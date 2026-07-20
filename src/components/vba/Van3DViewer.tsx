"use client";

/**
 * Viewer 3D des plans d'aménagement (prototype VBA).
 *
 * Charge un fichier GLB (export SketchUp : Fichier > Exporter > Modèle 3D > .glb)
 * et offre des outils de mesure type SketchUp via That Open Engine (licence MIT) :
 * - Mètre point à point (aimanté aux sommets)
 * - Cote d'arête au survol (l'arête s'illumine et affiche sa dimension)
 * - Isolation des composants du modèle (chaque groupe/composant SketchUp)
 *
 * Les librairies 3D (~1 Mo gzip) sont chargées dynamiquement côté client
 * uniquement, au montage du composant — aucun impact sur le reste du site.
 */

import { useEffect, useRef, useState } from "react";

type Mode = "orbit" | "length" | "edge";
type Units = "cm" | "m";

interface PartState {
  name: string;
  visible: boolean;
}

interface ViewerHandles {
  dispose: () => void;
  setMode: (mode: Mode) => void;
  setUnits: (units: Units) => void;
  clear: () => void;
  toggleGroup: (name: string, visible: boolean) => void;
}

const HINTS: Record<Mode, string> = {
  orbit: "Clic gauche : pivoter · Molette : zoom · Clic droit : déplacer",
  length: "Cliquez 2 points pour mesurer (aimanté aux sommets) · Échap : annuler",
  edge: "Survolez une arête pour voir sa cote · Cliquez pour la fixer",
};

export default function Van3DViewer({
  src,
  className = "",
}: {
  src: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handlesRef = useRef<ViewerHandles | null>(null);
  const modeRef = useRef<Mode>("orbit");

  const [mode, setModeState] = useState<Mode>("orbit");
  const [units, setUnitsState] = useState<Units>("cm");
  const [parts, setParts] = useState<PartState[]>([]);
  const [showParts, setShowParts] = useState(true);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let handles: ViewerHandles | null = null;

    (async () => {
      const [THREE, { GLTFLoader }, { deinterleaveGeometry }, OBC, OBCF] =
        await Promise.all([
          import("three"),
          import("three/examples/jsm/loaders/GLTFLoader.js"),
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
      world.scene.three.background = new THREE.Color("#10151f");

      const dom2d = world.renderer.three2D.domElement;
      dom2d.style.position = "absolute";
      dom2d.style.top = "0";
      dom2d.style.left = "0";
      dom2d.style.pointerEvents = "none";
      container.appendChild(dom2d);

      components.get(OBC.Grids).create(world);

      // ── Chargement du modèle GLB ─────────────────────────────────────────
      const gltf = await new GLTFLoader().loadAsync(src);
      if (disposed) {
        components.dispose();
        return;
      }
      const model = gltf.scene;
      world.scene.three.add(model);

      const groups = new Map<string, InstanceType<typeof THREE.Object3D>>();
      for (const child of model.children) {
        if (child.name) groups.set(child.name, child);
      }

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
      model.traverse((child) => {
        const mesh = child as InstanceType<typeof THREE.Mesh>;
        if (!mesh.isMesh) return;
        if (baked.has(mesh.geometry)) mesh.geometry = mesh.geometry.clone();
        deinterleaveGeometry(mesh.geometry);
        mesh.geometry.applyMatrix4(mesh.matrixWorld);
        baked.add(mesh.geometry);
        world.meshes.add(mesh as never);
      });
      model.traverse((obj) => {
        obj.position.set(0, 0, 0);
        obj.quaternion.identity();
        obj.scale.set(1, 1, 1);
        obj.updateMatrix();
      });
      model.updateMatrixWorld(true);

      // Cadrage initial sur le modèle
      const box = new THREE.Box3().setFromObject(model);
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      const c = sphere.center;
      world.camera.controls.setLookAt(
        c.x + sphere.radius * 1.6,
        c.y + sphere.radius * 1.2,
        c.z + sphere.radius * 1.6,
        c.x,
        c.y,
        c.z,
        false
      );
      world.camera.controls.fitToSphere(sphere, false);

      // ── Outils de mesure ─────────────────────────────────────────────────
      OBCF.SimpleDimensionLine.units = "cm";
      OBCF.SimpleDimensionLine.scale = 0.01;
      OBCF.SimpleDimensionLine.rounding = 1;

      const length = components.get(OBCF.LengthMeasurement);
      length.world = world;
      length.enabled = false;
      length.snapDistance = 0.3;
      length.color = new THREE.Color("#4bc3e3");

      const edge = components.get(OBCF.EdgeMeasurement);
      edge.world = world;
      edge.enabled = false;

      // Clic = placer un point de mesure — sauf si on vient d'orbiter (drag)
      let downX = 0;
      let downY = 0;
      const onPointerDown = (e: PointerEvent) => {
        downX = e.clientX;
        downY = e.clientY;
      };
      const onClick = (e: MouseEvent) => {
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
        if (modeRef.current === "length") length.create();
        else if (modeRef.current === "edge") edge.create();
      };
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") length.cancelCreation();
      };
      container.addEventListener("pointerdown", onPointerDown);
      container.addEventListener("click", onClick);
      window.addEventListener("keydown", onKeyDown);

      const resizeObserver = new ResizeObserver(() => world.renderer?.resize());
      resizeObserver.observe(container);

      // La lib ne masque jamais la preview d'arête d'elle-même (son
      // cancelCreation est vide) : on le fait à chaque sortie du mode.
      const hideEdgePreview = () => {
        if (edge.preview) edge.preview.visible = false;
      };

      handles = {
        setMode(m) {
          length.enabled = m === "length";
          edge.enabled = m === "edge";
          if (m !== "length") length.cancelCreation();
          if (m !== "edge") hideEdgePreview();
        },
        setUnits(u) {
          OBCF.SimpleDimensionLine.units = u;
          OBCF.SimpleDimensionLine.scale = u === "cm" ? 0.01 : 1;
          OBCF.SimpleDimensionLine.rounding = u === "cm" ? 1 : 2;
          // Réassigner le point final force le recalcul de l'étiquette
          for (const dim of length.list) dim.endPoint = dim.endPoint.clone();
        },
        clear() {
          length.deleteAll();
          edge.deleteAll();
          hideEdgePreview();
        },
        toggleGroup(name, visible) {
          const group = groups.get(name);
          if (!group) return;
          group.visible = visible;
          group.traverse((child) => {
            if ((child as { isMesh?: boolean }).isMesh) {
              if (visible) world.meshes.add(child as never);
              else world.meshes.delete(child as never);
            }
          });
        },
        dispose() {
          resizeObserver.disconnect();
          container.removeEventListener("pointerdown", onPointerDown);
          container.removeEventListener("click", onClick);
          window.removeEventListener("keydown", onKeyDown);
          components.dispose();
          container.innerHTML = "";
        },
      };
      handlesRef.current = handles;

      setParts(
        Array.from(groups.keys(), (name) => ({ name, visible: true }))
      );
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

  const togglePart = (name: string) => {
    setParts((prev) =>
      prev.map((p) => {
        if (p.name !== name) return p;
        handlesRef.current?.toggleGroup(name, !p.visible);
        return { ...p, visible: !p.visible };
      })
    );
  };

  const toolBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
      active
        ? "bg-[#4D5FEC] text-white"
        : "bg-white/10 text-white/80 hover:bg-white/20"
    }`;

  return (
    <div
      className={`van3d-viewer relative overflow-hidden rounded-2xl border border-white/10 bg-[#10151f] ${className}`}
    >
      {/* Points d'ancrage des mesures (classes générées par That Open) */}
      <style>{`
        .van3d-viewer .w-2.h-2 {
          width: 10px; height: 10px; border-radius: 9999px;
          background: #4bc3e3; border: 2px solid #fff;
        }
      `}</style>

      <div ref={containerRef} className="absolute inset-0 cursor-crosshair" />

      {/* Barre d'outils */}
      <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-1.5 rounded-xl bg-black/50 p-1.5 backdrop-blur-md">
        <button type="button" className={toolBtn(mode === "orbit")} onClick={() => setMode("orbit")}>
          Naviguer
        </button>
        <button type="button" className={toolBtn(mode === "length")} onClick={() => setMode("length")}>
          Mètre
        </button>
        <button type="button" className={toolBtn(mode === "edge")} onClick={() => setMode("edge")}>
          Cote d&apos;arête
        </button>
        <div className="mx-1 h-4 w-px bg-white/20" />
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white/80 hover:bg-red-500/70 hover:text-white transition-colors"
          onClick={() => handlesRef.current?.clear()}
        >
          Effacer
        </button>
      </div>

      {/* Unités */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-xl bg-black/50 p-1.5 backdrop-blur-md">
        {(["cm", "m"] as Units[]).map((u) => (
          <button key={u} type="button" className={toolBtn(units === u)} onClick={() => setUnits(u)}>
            {u}
          </button>
        ))}
      </div>

      {/* Panneau composants */}
      {parts.length > 0 && (
        <div className="absolute right-3 top-3 z-10 w-56 rounded-xl bg-black/50 p-3 backdrop-blur-md">
          <button
            type="button"
            className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-white/70"
            onClick={() => setShowParts((s) => !s)}
          >
            Aménagements
            <span>{showParts ? "−" : "+"}</span>
          </button>
          {showParts && (
            <ul className="mt-2 space-y-1 max-h-64 overflow-y-auto pr-1">
              {parts.map((p) => (
                <li key={p.name}>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-white/90 hover:text-white">
                    <input
                      type="checkbox"
                      checked={p.visible}
                      onChange={() => togglePart(p.name)}
                      className="h-3.5 w-3.5 accent-[#4D5FEC]"
                    />
                    {/* GLTFLoader remplace les espaces des noms par des _ */}
                    <span className="truncate">{p.name.replace(/_/g, " ")}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Aide contextuelle */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1.5 text-xs text-white/80 backdrop-blur-md">
        {HINTS[mode]}
      </div>

      {/* États chargement / erreur */}
      {status === "loading" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#10151f]">
          <div className="flex flex-col items-center gap-3 text-white/70">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#4bc3e3]" />
            <span className="text-sm">Chargement du plan 3D…</span>
          </div>
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#10151f]">
          <p className="max-w-sm text-center text-sm text-white/70">
            Impossible de charger le plan 3D. Vérifiez que le fichier{" "}
            <code className="text-white/90">{src}</code> existe.
          </p>
        </div>
      )}
    </div>
  );
}
