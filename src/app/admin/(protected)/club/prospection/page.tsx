import { getProspects } from "./actions";
import ProspectionClient from "./_components/ProspectionClient";

export default async function ProspectionPage() {
  const prospects = await getProspects().catch(() => []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-slate-400 text-sm font-medium mb-1">Club Privé / Prospection</p>
        <h1 className="text-3xl font-black text-slate-900">Prospection Partenaires</h1>
        <p className="text-slate-500 mt-1">Pipeline commercial — identifier, enrichir, emailer, suivre</p>
      </div>
      <ProspectionClient initialProspects={prospects} />
    </div>
  );
}
