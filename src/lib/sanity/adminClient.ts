import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const apiVersion = "2024-01-01";

// Client lecture — sans CDN pour toujours avoir les données fraiches
export const adminReadClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token: process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
});

// Client ecriture — pour les mutations (status, featured, etc.)
export const adminWriteClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
});

export const hasWriteAccess = Boolean(process.env.SANITY_API_WRITE_TOKEN);
