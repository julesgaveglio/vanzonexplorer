import type { Metadata } from "next";
import CompetitorsClient from "./_components/CompetitorsClient";

export const metadata: Metadata = {
  title: "Concurrents VBA | Vanzon Admin",
};

export default function CompetitorsPage() {
  return <CompetitorsClient />;
}
