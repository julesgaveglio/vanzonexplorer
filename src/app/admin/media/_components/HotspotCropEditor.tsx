"use client";

import { useState, useRef, useCallback } from "react";

type Hotspot = { x: number; y: number; width: number; height: number };
type Crop = { top: number; right: number; bottom: number; left: number };

interface Props {
  imageUrl: string;
  hotspot: Hotspot;
  crop: Crop;
  onChange: (hotspot: Hotspot, crop: Crop) => void;
}

export default function HotspotCropEditor({ imageUrl, hotspot, crop, onChange }: Props) {
  const [hs, setHs] = useState<Hotspot>(hotspot);
  const [cr, setCr] = useState<Crop>(crop);
  const imgRef = useRef<HTMLDivElement>(null);

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imgRef.current) return;
      const rect = imgRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      const newHs = { ...hs, x, y };
      setHs(newHs);
      onChange(newHs, cr);
    },
    [hs, cr, onChange]
  );

  const updateCrop = useCallback(
    (key: keyof Crop, value: number) => {
      const newCr = { ...cr, [key]: value / 100 };
      setCr(newCr);
      onChange(hs, newCr);
    },
    [hs, cr, onChange]
  );

  // Crop overlay dimensions
  const cropStyle = {
    top: `${cr.top * 100}%`,
    right: `${cr.right * 100}%`,
    bottom: `${cr.bottom * 100}%`,
    left: `${cr.left * 100}%`,
  };

  const sliders: { key: keyof Crop; label: string; icon: string }[] = [
    { key: "top", label: "Haut", icon: "↑" },
    { key: "bottom", label: "Bas", icon: "↓" },
    { key: "left", label: "Gauche", icon: "←" },
    { key: "right", label: "Droite", icon: "→" },
  ];

  return (
    <div className="space-y-4">
      {/* Image avec hotspot interactif */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Point focal <span className="font-normal text-slate-400">(cliquer pour deplacer)</span>
        </p>
        <div
          ref={imgRef}
          className="relative rounded-xl overflow-hidden cursor-crosshair select-none bg-slate-100"
          style={{ aspectRatio: "16/9" }}
          onClick={handleImageClick}
        >
          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${imageUrl}?w=600&auto=format&q=70`}
            alt="Editeur hotspot"
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />

          {/* Overlay de crop (zones sombres) */}
          {/* Top */}
          {cr.top > 0 && (
            <div className="absolute inset-x-0 top-0 bg-black/40 pointer-events-none" style={{ height: `${cr.top * 100}%` }} />
          )}
          {/* Bottom */}
          {cr.bottom > 0 && (
            <div className="absolute inset-x-0 bottom-0 bg-black/40 pointer-events-none" style={{ height: `${cr.bottom * 100}%` }} />
          )}
          {/* Left */}
          {cr.left > 0 && (
            <div className="absolute inset-y-0 left-0 bg-black/40 pointer-events-none" style={{ width: `${cr.left * 100}%` }} />
          )}
          {/* Right */}
          {cr.right > 0 && (
            <div className="absolute inset-y-0 right-0 bg-black/40 pointer-events-none" style={{ width: `${cr.right * 100}%` }} />
          )}

          {/* Crop border */}
          <div
            className="absolute border-2 border-white/70 border-dashed pointer-events-none"
            style={cropStyle}
          />

          {/* Hotspot circle */}
          <div
            className="absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${hs.x * 100}%`, top: `${hs.y * 100}%` }}
          >
            <div className="w-full h-full rounded-full border-2 border-white shadow-lg bg-blue-500/40 backdrop-blur-sm" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white shadow" />
            </div>
          </div>

          {/* Label hotspot position */}
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-mono px-2 py-1 rounded-lg pointer-events-none">
            {Math.round(hs.x * 100)}%, {Math.round(hs.y * 100)}%
          </div>
        </div>
      </div>

      {/* Sliders de crop */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Crop <span className="font-normal text-slate-400">(marges a rogner)</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          {sliders.map(({ key, label, icon }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-500">{icon} {label}</label>
                <span className="text-xs font-mono text-slate-400">{Math.round(cr[key] * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                step={1}
                value={Math.round(cr[key] * 100)}
                onChange={(e) => updateCrop(key, Number(e.target.value))}
                className="w-full h-1.5 rounded-full accent-blue-500"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            const reset: Crop = { top: 0, right: 0, bottom: 0, left: 0 };
            setCr(reset);
            const resetHs: Hotspot = { x: 0.5, y: 0.5, width: 0.5, height: 0.5 };
            setHs(resetHs);
            onChange(resetHs, reset);
          }}
          className="mt-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Reinitialiser
        </button>
      </div>
    </div>
  );
}
