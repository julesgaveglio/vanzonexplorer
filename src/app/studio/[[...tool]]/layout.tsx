import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vanzon Studio",
  description: "Sanity Studio — Gestion du contenu Vanzon Explorer",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50">
      {children}
    </div>
  );
}
