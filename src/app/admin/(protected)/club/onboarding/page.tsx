import { Metadata } from "next";
import OnboardingChat from "./OnboardingChat";

export const metadata: Metadata = {
  title: "Onboarding Marque — Vanzon Admin",
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return <OnboardingChat />;
}
