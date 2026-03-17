import fs from "fs";
import path from "path";
import AgentsClient from "./AgentsClient";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  status: "active" | "inactive" | "paused";
  description: string;
  trigger: "cron" | "manual" | "webhook";
  schedule: string;
  cronExpression: string | null;
  file: string;
  workflow: string | null;
  apis: string[];
  output: string;
  manualCommand: string;
  tags: string[];
  pipeline: string;
}

function getAgents(): Agent[] {
  const registryPath = path.join(process.cwd(), "scripts/agents/registry.json");
  const raw = fs.readFileSync(registryPath, "utf-8");
  return JSON.parse(raw) as Agent[];
}

function getQueueStats() {
  const queuePath = path.join(process.cwd(), "scripts/data/article-queue.json");
  const raw = fs.readFileSync(queuePath, "utf-8");
  const queue = JSON.parse(raw) as { status: string }[];
  return {
    published: queue.filter((a) => a.status === "published").length,
    pending: queue.filter((a) => a.status === "pending").length,
    total: queue.length,
  };
}

export default function AgentsPage() {
  const agents = getAgents();
  const queueStats = getQueueStats();

  return <AgentsClient agents={agents} queueStats={queueStats} />;
}
