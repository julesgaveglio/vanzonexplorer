"use client";

import { useState } from "react";

type Profile = {
  id: string;
  clerk_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  van_model: string | null;
  van_year: number | null;
  plan: string;
} | null;

interface Props {
  profile: Profile;
  clerkId: string;
  userEmail: string;
  userName: string;
}

export default function ProfileTab({ profile, userEmail, userName }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [vanModel, setVanModel] = useState(profile?.van_model ?? "");
  const [vanYear, setVanYear] = useState(profile?.van_year?.toString() ?? "");

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone || null,
          van_model: vanModel || null,
          van_year: vanYear ? parseInt(vanYear) : null,
        }),
      });
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { label: "Nom complet", value: userName, editable: false },
    { label: "Email", value: userEmail, editable: false },
    {
      label: "Téléphone",
      value: phone,
      editable: true,
      type: "tel",
      placeholder: "+33 6 00 00 00 00",
      onChange: setPhone,
    },
  ];

  const vanFields = [
    {
      label: "Modèle de van",
      value: vanModel,
      editable: true,
      type: "text",
      placeholder: "ex: Renault Trafic III",
      onChange: setVanModel,
    },
    {
      label: "Année",
      value: vanYear,
      editable: true,
      type: "number",
      placeholder: "ex: 2020",
      onChange: setVanYear,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Carte infos personnelles */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-slate-900">Informations personnelles</h2>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="text-xs text-green-600 font-medium animate-fade-in">
                Enregistré ✓
              </span>
            )}
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-sm font-semibold text-white bg-slate-900 px-4 py-1.5 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "..." : "Enregistrer"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="text-sm font-medium text-accent-blue hover:underline"
              >
                Modifier
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field.label}>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                {field.label}
              </label>
              {field.editable && editing ? (
                <input
                  type={field.type}
                  value={field.value}
                  onChange={(e) => field.onChange?.(e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2.5 text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors"
                />
              ) : (
                <p className="text-sm text-slate-700 py-2.5 px-4 bg-slate-50 rounded-xl">
                  {field.value || <span className="text-slate-400 italic">Non renseigné</span>}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Carte van */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-base font-bold text-slate-900 mb-6">Mon van</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vanFields.map((field) => (
            <div key={field.label}>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                {field.label}
              </label>
              {editing ? (
                <input
                  type={field.type}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2.5 text-sm text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors"
                />
              ) : (
                <p className="text-sm text-slate-700 py-2.5 px-4 bg-slate-50 rounded-xl">
                  {field.value || <span className="text-slate-400 italic">Non renseigné</span>}
                </p>
              )}
            </div>
          ))}
        </div>

        {!editing && !vanModel && (
          <p className="text-xs text-slate-400 mt-4">
            Vous n&apos;avez pas encore renseigné votre van. Cliquez sur &quot;Modifier&quot; pour compléter votre profil.
          </p>
        )}
      </div>

      {/* Compte Clerk */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Sécurité du compte</h2>
        <p className="text-sm text-slate-500 mb-4">
          Gérez votre mot de passe, vos méthodes de connexion et les sessions actives depuis votre profil Clerk.
        </p>
        <a
          href="/user"
          className="inline-flex items-center gap-2 text-sm font-semibold text-accent-blue hover:underline"
        >
          Gérer le compte →
        </a>
      </div>
    </div>
  );
}
