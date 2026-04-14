import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};

export default function TunnelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-white">
      {children}
    </main>
  );
}
