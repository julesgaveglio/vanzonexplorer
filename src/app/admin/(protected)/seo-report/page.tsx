import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SeoReportClient from "./SeoReportClient";

export const metadata = { title: "Rapport SEO — Vanzon Admin" };

export default async function SeoReportPage() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/login");

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Générateur de Rapport SEO</h1>
        <p className="text-sm text-slate-500 mt-1">
          Analyse complète d&apos;un site — performance, on-page, autorité, concurrents et recommandations IA.
        </p>
      </div>
      <SeoReportClient />
    </div>
  );
}
