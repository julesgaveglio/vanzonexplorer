"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import LiquidButton from "@/components/ui/LiquidButton";
import { trackConversion } from "@/lib/analytics";

const schema = z.object({
  prenom: z.string().min(2, "Prenom requis"),
  nom: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
});

type FormData = z.infer<typeof schema>;

function triggerDownload(fileUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function ResourceDownloadForm({
  ressource,
  source,
}: {
  ressource: string;
  source: string;
}) {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError("");
    try {
      const res = await fetch("/api/leads/facebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, ressource, source }),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error || "Une erreur est survenue.");
        return;
      }
      trackConversion("resource_download", { ressource, source });
      triggerDownload(json.fileUrl, json.fileName);
      setDone(true);
    } catch {
      setServerError("Erreur de connexion. Reessayez.");
    }
  }

  const inputCls =
    "w-full bg-white/75 border border-slate-200 rounded-xl px-4 py-3 text-text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all";

  if (done) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-4xl mb-4">📄</div>
        <h3 className="text-xl font-bold text-text-primary mb-2">
          Ton telechargement a demarre !
        </h3>
        <p className="text-text-secondary">
          Si rien ne s&apos;est passe, verifie les telechargements bloques par ton
          navigateur.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="glass-card p-6 sm:p-8 space-y-5"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="prenom"
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            Prenom
          </label>
          <input
            id="prenom"
            type="text"
            placeholder="Ton prenom"
            className={inputCls}
            {...register("prenom")}
          />
          {errors.prenom && (
            <p className="text-red-500 text-sm mt-1">{errors.prenom.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="nom"
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            Nom
          </label>
          <input
            id="nom"
            type="text"
            placeholder="Ton nom"
            className={inputCls}
            {...register("nom")}
          />
          {errors.nom && (
            <p className="text-red-500 text-sm mt-1">{errors.nom.message}</p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-text-secondary mb-1.5"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="ton@email.com"
          className={inputCls}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-red-500 text-sm text-center">{serverError}</p>
      )}

      <LiquidButton
        type="submit"
        variant="blue"
        size="lg"
        fullWidth
        disabled={isSubmitting}
      >
        {isSubmitting ? "Envoi en cours..." : "Telecharger le PDF (gratuit)"}
      </LiquidButton>

      <p className="text-xs text-text-secondary text-center">
        Pas de spam. Juste ta ressource, direct.
      </p>
    </form>
  );
}
