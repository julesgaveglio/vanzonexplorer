export function extractText(blocks: { text?: string }[] | null | undefined): string {
  if (!Array.isArray(blocks)) return "";
  return blocks.map((b) => b.text || "").filter(Boolean).join("\n\n");
}
