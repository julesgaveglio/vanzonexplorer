import Link from "next/link";
import { notFound } from "next/navigation";
import { getVanAdmin } from "../actions";
import VanForm from "../_components/VanForm";

export default async function EditVanPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const isNew = id === "nouveau";

  if (isNew) {
    return (
      <div className="p-8 max-w-4xl">
        <p className="text-slate-400 text-sm font-medium mb-1">
          <Link href="/admin/vans" className="hover:text-slate-600 transition-colors">Vans</Link>{" "}
          / Nouveau van
        </p>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Nouveau van</h1>
        <p className="text-slate-400 text-sm mb-8">
          Remplissez les informations ci-dessous. Le van sera publié immédiatement sur le site.
        </p>
        <VanForm />
      </div>
    );
  }

  const van = await getVanAdmin(id).catch(() => null);
  if (!van) notFound();

  return (
    <div className="p-8 max-w-4xl">
      <p className="text-slate-400 text-sm font-medium mb-1">
        <Link href="/admin/vans" className="hover:text-slate-600 transition-colors">Vans</Link>{" "}
        / {van.name}
      </p>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">{van.name}</h1>
          <p className="text-slate-400 text-sm mt-1">
            Modifications publiées en direct sur le site web
          </p>
        </div>
        <div className="flex items-center gap-3">
          {van.slug && (
            <a href={`/location/${van.slug}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 px-3 py-2 rounded-lg">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Voir sur le site
            </a>
          )}
        </div>
      </div>
      <VanForm van={van} />
    </div>
  );
}
