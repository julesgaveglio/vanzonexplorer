"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type Hotspot = { x: number; y: number; width: number; height: number };
type Crop = { top: number; right: number; bottom: number; left: number };
type DragHandle = "tl" | "tc" | "tr" | "ml" | "mr" | "bl" | "bc" | "br" | "move";

interface Props {
  imageUrl: string;
  hotspot: Hotspot;
  crop: Crop;
  onChange: (hotspot: Hotspot, crop: Crop) => void;
}

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));
const MIN_VISIBLE = 0.15; // 15% minimum visible after crop

export default function HotspotCropEditor({ imageUrl, hotspot, crop, onChange }: Props) {
  const [hs, setHs] = useState<Hotspot>(hotspot);
  const [cr, setCr] = useState<Crop>(crop);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stable refs to avoid stale closures in global listeners
  const hsRef = useRef(hs);
  const crRef = useRef(cr);
  useEffect(() => { hsRef.current = hs; }, [hs]);
  useEffect(() => { crRef.current = cr; }, [cr]);

  const dragRef = useRef<{
    handle: DragHandle;
    startX: number;
    startY: number;
    startCr: Crop;
    moved: boolean;
  } | null>(null);

  // Crop rect as fractions [0–1] of container
  const rect = {
    x: cr.left,
    y: cr.top,
    w: 1 - cr.left - cr.right,
    h: 1 - cr.top - cr.bottom,
  };

  const startDrag = useCallback((handle: DragHandle, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startCr: { ...crRef.current },
      moved: false,
    };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current || !containerRef.current) return;
      const bounds = containerRef.current.getBoundingClientRect();
      const dx = (e.clientX - dragRef.current.startX) / bounds.width;
      const dy = (e.clientY - dragRef.current.startY) / bounds.height;

      if (Math.abs(dx) > 0.003 || Math.abs(dy) > 0.003) {
        dragRef.current.moved = true;
      }

      const { handle, startCr } = dragRef.current;
      let { top, right, bottom, left } = startCr;

      if (handle === "move") {
        // Move the entire crop rect
        const newLeft = clamp(left + dx);
        const newRight = clamp(right - dx);
        const newTop = clamp(top + dy);
        const newBottom = clamp(bottom - dy);
        // Only move if rect stays large enough
        if (newLeft + newRight <= 1 - MIN_VISIBLE && newTop + newBottom <= 1 - MIN_VISIBLE) {
          top = newTop; right = newRight; bottom = newBottom; left = newLeft;
        }
      } else {
        // Resize: handle[0] = vertical side (t/m/b), handle[1] = horizontal side (l/c/r)
        if (handle[0] === "t") top = clamp(startCr.top + dy, 0, 1 - startCr.bottom - MIN_VISIBLE);
        if (handle[0] === "b") bottom = clamp(startCr.bottom - dy, 0, 1 - startCr.top - MIN_VISIBLE);
        if (handle[1] === "l") left = clamp(startCr.left + dx, 0, 1 - startCr.right - MIN_VISIBLE);
        if (handle[1] === "r") right = clamp(startCr.right - dx, 0, 1 - startCr.left - MIN_VISIBLE);
      }

      const newCr = { top, right, bottom, left };
      setCr(newCr);
      onChange(hsRef.current, newCr);
    };

    const onUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [onChange]);

  // Click on image → move hotspot (only if not a drag)
  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const bounds = containerRef.current.getBoundingClientRect();
      const x = clamp((e.clientX - bounds.left) / bounds.width);
      const y = clamp((e.clientY - bounds.top) / bounds.height);
      const newHs = { ...hsRef.current, x, y };
      setHs(newHs);
      onChange(newHs, crRef.current);
    },
    [onChange]
  );

  // Corner + edge handles
  const handles: { key: DragHandle; cx: number; cy: number; cursor: string }[] = [
    { key: "tl", cx: rect.x,               cy: rect.y,               cursor: "nw-resize" },
    { key: "tc", cx: rect.x + rect.w / 2,  cy: rect.y,               cursor: "n-resize"  },
    { key: "tr", cx: rect.x + rect.w,      cy: rect.y,               cursor: "ne-resize" },
    { key: "ml", cx: rect.x,               cy: rect.y + rect.h / 2,  cursor: "w-resize"  },
    { key: "mr", cx: rect.x + rect.w,      cy: rect.y + rect.h / 2,  cursor: "e-resize"  },
    { key: "bl", cx: rect.x,               cy: rect.y + rect.h,      cursor: "sw-resize" },
    { key: "bc", cx: rect.x + rect.w / 2,  cy: rect.y + rect.h,      cursor: "s-resize"  },
    { key: "br", cx: rect.x + rect.w,      cy: rect.y + rect.h,      cursor: "se-resize" },
  ];

  const hasCrop = cr.top > 0.01 || cr.right > 0.01 || cr.bottom > 0.01 || cr.left > 0.01;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Cadrage & Point focal
          <span className="font-normal text-slate-400 ml-1">— glisser les poignées · cliquer pour le focal</span>
        </p>

        <div
          ref={containerRef}
          className="relative rounded-xl overflow-hidden select-none bg-slate-100"
          style={{ aspectRatio: "16/9", cursor: "crosshair" }}
          onClick={handleContainerClick}
        >
          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${imageUrl}?w=800&auto=format&q=75`}
            alt="Editeur cadrage"
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />

          {/* Dark overlay outside crop — 4 bands */}
          {/* Top band */}
          <div
            className="absolute inset-x-0 top-0 bg-black/50 pointer-events-none transition-all"
            style={{ height: `${cr.top * 100}%` }}
          />
          {/* Bottom band */}
          <div
            className="absolute inset-x-0 bottom-0 bg-black/50 pointer-events-none transition-all"
            style={{ height: `${cr.bottom * 100}%` }}
          />
          {/* Left band (between top/bottom) */}
          <div
            className="absolute left-0 bg-black/50 pointer-events-none transition-all"
            style={{ top: `${cr.top * 100}%`, height: `${rect.h * 100}%`, width: `${cr.left * 100}%` }}
          />
          {/* Right band */}
          <div
            className="absolute right-0 bg-black/50 pointer-events-none transition-all"
            style={{ top: `${cr.top * 100}%`, height: `${rect.h * 100}%`, width: `${cr.right * 100}%` }}
          />

          {/* Crop rect border */}
          <div
            className="absolute border-2 border-white shadow pointer-events-none"
            style={{
              left: `${rect.x * 100}%`,
              top: `${rect.y * 100}%`,
              width: `${rect.w * 100}%`,
              height: `${rect.h * 100}%`,
            }}
          >
            {/* Rule of thirds */}
            <div className="absolute inset-0 pointer-events-none opacity-25">
              <div className="absolute left-1/3 inset-y-0 border-l border-white" />
              <div className="absolute left-2/3 inset-y-0 border-l border-white" />
              <div className="absolute top-1/3 inset-x-0 border-t border-white" />
              <div className="absolute top-2/3 inset-x-0 border-t border-white" />
            </div>
          </div>

          {/* Move handle (interior of crop rect) */}
          <div
            className="absolute"
            style={{
              left: `${rect.x * 100}%`,
              top: `${rect.y * 100}%`,
              width: `${rect.w * 100}%`,
              height: `${rect.h * 100}%`,
              cursor: "move",
            }}
            onMouseDown={(e) => startDrag("move", e)}
          />

          {/* Resize handles */}
          {handles.map(({ key, cx, cy, cursor }) => (
            <div
              key={key}
              className="absolute z-10 w-4 h-4 bg-white border-2 border-blue-500 rounded-sm shadow-lg hover:scale-110 transition-transform"
              style={{
                left: `${cx * 100}%`,
                top: `${cy * 100}%`,
                transform: "translate(-50%, -50%)",
                cursor,
              }}
              onMouseDown={(e) => startDrag(key, e)}
            />
          ))}

          {/* Hotspot dot */}
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: `${hs.x * 100}%`,
              top: `${hs.y * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="w-7 h-7 rounded-full border-2 border-white shadow-lg bg-blue-500/50 backdrop-blur-sm flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white shadow" />
            </div>
          </div>

          {/* Coords label */}
          <div className="absolute bottom-2 right-2 z-20 bg-black/60 text-white text-xs font-mono px-2 py-1 rounded-lg pointer-events-none flex gap-2">
            <span>Focal {Math.round(hs.x * 100)}%,{Math.round(hs.y * 100)}%</span>
            {hasCrop && (
              <span className="opacity-60">
                Crop T{Math.round(cr.top * 100)} R{Math.round(cr.right * 100)} B{Math.round(cr.bottom * 100)} L{Math.round(cr.left * 100)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reset */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {hasCrop
            ? `Crop actif — zone visible : ${Math.round(rect.w * 100)}% × ${Math.round(rect.h * 100)}%`
            : "Aucun crop — image complète"}
        </p>
        {hasCrop && (
          <button
            type="button"
            onClick={() => {
              const reset: Crop = { top: 0, right: 0, bottom: 0, left: 0 };
              const resetHs: Hotspot = { x: 0.5, y: 0.5, width: 0.5, height: 0.5 };
              setCr(reset);
              setHs(resetHs);
              onChange(resetHs, reset);
            }}
            className="text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
          >
            Reinitialiser
          </button>
        )}
      </div>
    </div>
  );
}
