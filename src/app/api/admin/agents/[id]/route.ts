import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PROMPTS_DIR = path.join(process.cwd(), "scripts/agents/prompts");

const AGENT_PROMPT_FILES: Record<string, string> = {
  "blog-writer": "blog-writer.md",
  "queue-builder-monthly": "queue-builder-monthly.md",
  "article-optimizer-quarterly": "article-optimizer-quarterly.md",
  "keyword-research-quarterly": "keyword-research-quarterly.json",
  "seo-checker": "seo-checker.md",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const fileName = AGENT_PROMPT_FILES[params.id];
  if (!fileName) {
    return NextResponse.json({ error: "Agent inconnu" }, { status: 404 });
  }

  const filePath = path.join(PROMPTS_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ content: "", exists: false });
  }

  const content = fs.readFileSync(filePath, "utf-8");
  return NextResponse.json({ content, exists: true, fileName });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const fileName = AGENT_PROMPT_FILES[params.id];
  if (!fileName) {
    return NextResponse.json({ error: "Agent inconnu" }, { status: 404 });
  }

  const body = await req.json() as { content: string };
  if (typeof body.content !== "string") {
    return NextResponse.json({ error: "content manquant" }, { status: 400 });
  }

  if (!fs.existsSync(PROMPTS_DIR)) {
    fs.mkdirSync(PROMPTS_DIR, { recursive: true });
  }

  const filePath = path.join(PROMPTS_DIR, fileName);
  fs.writeFileSync(filePath, body.content, "utf-8");

  return NextResponse.json({ ok: true, fileName });
}
