import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#B9945F",
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
