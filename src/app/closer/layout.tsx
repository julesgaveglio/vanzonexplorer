import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";

const ALLOWED_EMAILS = (process.env.ADMIN_EMAILS ?? "gavegliojules@gmail.com,vanzonexplorer@gmail.com,jules.skate64@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

export const metadata: Metadata = {
  title: "Closer Coach",
  description: "Analyse tes appels de closing et progresse. Feedback concret, sans complaisance.",
  manifest: "/closer/manifest.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Closer",
  },
  icons: {
    apple: "/closer/apple-touch-icon.png",
    icon: "/closer/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function CloserLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/admin/login");

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? "";
  if (!ALLOWED_EMAILS.includes(email)) redirect("/");

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900 antialiased">{children}</div>
  );
}
