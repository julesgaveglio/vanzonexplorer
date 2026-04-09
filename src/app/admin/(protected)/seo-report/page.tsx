import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SeoReportClient from "./SeoReportClient";
import { AdminPageHeader } from "@/app/admin/_components/ui";

export const metadata = { title: "Rapport SEO — Vanzon Admin" };

export default async function SeoReportPage() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/login");

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <AdminPageHeader
        title="Générateur de Rapport SEO"
        subtitle="Analyse complète d'un site — performance, on-page, autorité, concurrents et recommandations IA."
      />
      <SeoReportClient />
    </div>
  );
}
