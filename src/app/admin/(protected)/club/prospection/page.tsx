import { getProspects } from "./actions";
import ProspectionClient from "./_components/ProspectionClient";
import { AdminPageHeader } from "@/app/admin/_components/ui";

export default async function ProspectionPage() {
  const prospects = await getProspects().catch(() => []);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Prospection Partenaires"
        subtitle="Pipeline commercial — identifier, enrichir, emailer, suivre"
      />
      <ProspectionClient initialProspects={prospects} />
    </div>
  );
}
