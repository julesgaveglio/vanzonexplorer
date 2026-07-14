import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import PulseShell from "./PulseShell";

const ALLOWED_EMAILS = (process.env.ADMIN_EMAILS ?? "gavegliojules@gmail.com,vanzonexplorer@gmail.com,jules.skate64@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

export const metadata: Metadata = {
  title: "Vanzon Pulse",
  description: "Le pouls de Vanzon Explorer — ce qui marche, en un coup d'oeil.",
  manifest: "/pulse/manifest.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vanzon Pulse",
  },
  icons: {
    apple: "/pulse/apple-touch-icon.png",
    icon: "/pulse/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function PulseLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/admin/login");

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? "";
  if (!ALLOWED_EMAILS.includes(email)) redirect("/");

  return <PulseShell>{children}</PulseShell>;
}
