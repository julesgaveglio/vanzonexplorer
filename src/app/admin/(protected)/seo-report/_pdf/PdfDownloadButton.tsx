"use client";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SeoReportPDF from "./SeoReportPDF";
import type { SeoReportData } from "@/types/seo-report";

interface Props { report: SeoReportData }

export default function PdfDownloadButton({ report }: Props) {
  const filename = `rapport-seo-${new URL(report.url).hostname}-${new Date().toISOString().slice(0, 10)}.pdf`;

  return (
    <PDFDownloadLink
      document={<SeoReportPDF report={report} />}
      fileName={filename}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
    >
      {({ loading }) => loading ? "Préparation PDF…" : "Télécharger PDF"}
    </PDFDownloadLink>
  );
}
