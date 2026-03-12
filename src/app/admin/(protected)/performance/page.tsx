import { Metadata } from "next";
import PerformanceClient from "./PerformanceClient";

export const metadata: Metadata = {
  title: "Performance — Vanzon Admin",
  robots: { index: false, follow: false },
};

export default function PerformancePage() {
  return <PerformanceClient />;
}
