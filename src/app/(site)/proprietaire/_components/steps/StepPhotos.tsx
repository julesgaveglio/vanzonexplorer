"use client";

import { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";

const inputCls =
  "w-full bg-white/75 border border-slate-200 rounded-xl px-4 py-3 text-text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all";

type SlotDef = {
  field: string;
  label: string;
  hint: string;
  required: boolean;
  isMain?: boolean;
};

const SLOTS: SlotDef[] = [
  {
    field: "photo_exterior_front",
    label: "Extérieur avant",
    hint: "Photo de face du van",
    required: true,
    isMain: true,
  },
  {
    field: "photo_exterior_side",
    label: "Extérieur côté / arrière",
    hint: "Vue latérale ou arrière",
    required: false,
  },
  {
    field: "photo_interior",
    label: "Intérieur général",
    hint: "Vue d'ensemble de l'habitacle",
    required: true,
  },
  {
    field: "photo_sleeping",
    label: "Zone couchage",
    hint: "Le lit aménagé",
    required: true,
  },
  {
    field: "photo_kitchen",
    label: "Cuisine",
    hint: "Plaques, réfrigérateur, plan de travail",
    required: false,
  },
  {
    field: "photo_bathroom",
    label: "Salle de bain / WC",
    hint: "Douche et/ou toilettes",
    required: false,
  },
  {
    field: "photo_detail",
    label: "Détail ou autre",
    hint: "Tableau de bord, rangements, équipement spécifique...",
    required: false,
  },
];

function CameraIcon() {
  return (
    <svg
      className="w-6 h-6 text-slate-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
      />
    </svg>
  );
}

function PhotoSlot({ slot }: { slot: SlotDef }) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const value: string = watch(slot.field) || "";
  const fieldError = errors[slot.field];
  const hasError = !!(fieldError || uploadError);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
        setUploadError("JPG, PNG ou WebP uniquement");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Fichier trop lourd (max 5 Mo)");
        return;
      }

      setUploading(true);
      setUploadError("");

      const fd = new FormData();
      fd.append("file", file);

      try {
        const res = await fetch("/api/marketplace/upload-photo", {
          method: "POST",
          body: fd,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erreur upload");
        setValue(slot.field, json.url, {
          shouldValidate: true,
          shouldDirty: true,
        });
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : "Erreur upload"
        );
      } finally {
        setUploading(false);
      }
    },
    [slot.field, setValue]
  );

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label */}
      <div className="flex items-center gap-1 flex-wrap min-h-[18px]">
        <span className="text-xs font-semibold text-slate-700 leading-tight">
          {slot.label}
        </span>
        {slot.required && (
          <span className="text-red-400 text-[11px] font-bold">*</span>
        )}
        {slot.isMain && (
          <span className="text-[9px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
            Principale
          </span>
        )}
      </div>

      {/* Slot */}
      {value ? (
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 group border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={slot.label}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => {
              setValue(slot.field, "", { shouldValidate: true });
              setUploadError("");
            }}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-[11px] transition-colors sm:opacity-0 sm:group-hover:opacity-100"
          >
            ✕
          </button>
          {slot.isMain && (
            <span className="absolute bottom-1.5 left-1.5 bg-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Principale
            </span>
          )}
        </div>
      ) : (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          className={`aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all select-none ${
            dragOver
              ? "border-blue-400 bg-blue-50"
              : hasError
              ? "border-red-300 bg-red-50/50"
              : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30"
          }`}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          {uploading ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <CameraIcon />
          )}
        </label>
      )}

      {/* Error / hint */}
      {uploadError ? (
        <p className="text-red-500 text-[11px]">{uploadError}</p>
      ) : fieldError ? (
        <p className="text-red-500 text-[11px]">
          {fieldError.message as string}
        </p>
      ) : !value ? (
        <p className="text-[10px] text-slate-400 leading-tight">{slot.hint}</p>
      ) : null}
    </div>
  );
}

export default function StepPhotos() {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext();
  const description = watch("description") || "";

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Photos & description
        </h3>
        <p className="text-sm text-slate-500 mb-5">
          Les photos font toute la différence. Les 3 slots marqués{" "}
          <span className="text-red-400 font-bold">*</span> sont obligatoires.
        </p>
      </div>

      {/* Titre */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-text-secondary mb-1.5"
        >
          Titre de l&apos;annonce
        </label>
        <input
          id="title"
          type="text"
          placeholder="Ex : Van aménagé cosy pour 2 — Pays Basque"
          className={inputCls}
          maxLength={100}
          {...register("title")}
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">
            {errors.title.message as string}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-text-secondary mb-1.5"
        >
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          placeholder="Décrivez votre van : son aménagement, ce qui le rend unique, les itinéraires que vous recommandez..."
          className={inputCls + " resize-none"}
          maxLength={2000}
          {...register("description")}
        />
        <div className="flex justify-between mt-1">
          {errors.description ? (
            <p className="text-red-500 text-sm">
              {errors.description.message as string}
            </p>
          ) : (
            <span />
          )}
          <span
            className={`text-xs ${
              description.length < 50 ? "text-amber-500" : "text-slate-400"
            }`}
          >
            {description.length}/2000
          </span>
        </div>
      </div>

      {/* Photos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-text-secondary">
            Photos du van
          </label>
          <span className="text-xs text-slate-400">
            <span className="text-red-400">*</span> obligatoire
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SLOTS.map((slot) => (
            <PhotoSlot key={slot.field} slot={slot} />
          ))}
        </div>
      </div>
    </div>
  );
}
