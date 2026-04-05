"use client";

import { useFormContext, useController } from "react-hook-form";
import PhotoUploader from "../PhotoUploader";

const inputCls =
  "w-full bg-white/75 border border-slate-200 rounded-xl px-4 py-3 text-text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all";

export default function StepPhotos() {
  const { register, formState: { errors }, control, watch } = useFormContext();

  const { field: photosField } = useController({
    name: "photos",
    control,
  });

  const description = watch("description") || "";

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Photos & description</h3>
        <p className="text-sm text-slate-500 mb-5">Les photos font toute la différence. Montrez l&apos;extérieur, l&apos;intérieur et les détails qui rendent votre van unique.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Photos du van <span className="text-slate-400 font-normal">(minimum 3)</span>
        </label>
        <PhotoUploader
          photos={photosField.value || []}
          onPhotosChange={(newPhotos) => photosField.onChange(newPhotos)}
        />
        {errors.photos && (
          <p className="text-red-500 text-sm mt-2">{errors.photos.message as string}</p>
        )}
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1.5">
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
          <p className="text-red-500 text-sm mt-1">{errors.title.message as string}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1.5">
          Description
        </label>
        <textarea
          id="description"
          rows={5}
          placeholder="Décrivez votre van : son aménagement, ce qui le rend unique, les itinéraires que vous recommandez..."
          className={inputCls + " resize-none"}
          maxLength={2000}
          {...register("description")}
        />
        <div className="flex justify-between mt-1">
          {errors.description ? (
            <p className="text-red-500 text-sm">{errors.description.message as string}</p>
          ) : (
            <span />
          )}
          <span className={`text-xs ${description.length < 50 ? "text-amber-500" : "text-slate-400"}`}>
            {description.length}/2000
          </span>
        </div>
      </div>
    </div>
  );
}
