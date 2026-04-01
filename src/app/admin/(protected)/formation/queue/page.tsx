import type { Metadata } from "next";
import QueueGeneratorClient from "./_components/QueueGeneratorClient";

export const metadata: Metadata = {
  title: "File d'articles VBA | Vanzon Admin",
};

export default function QueuePage() {
  return <QueueGeneratorClient />;
}
