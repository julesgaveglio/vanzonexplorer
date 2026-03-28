import type { Metadata } from "next";
import OnboardingClient from "./_components/OnboardingClient";

export const metadata: Metadata = {
  title: "Bienvenue — Club Privé Vanzon",
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return <OnboardingClient />;
}
