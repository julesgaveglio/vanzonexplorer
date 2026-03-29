export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return new Response(null, { status: 404 });
  }

  const { statSync } = await import('fs');
  const { findActiveJsonlFiles } = await import('@/lib/pixel-agents/jsonlParser');

  const sessions = findActiveJsonlFiles();
  const agents: Array<{ id: number; folderName: string; status: 'active' | 'idle' }> = [];

  for (const session of sessions) {
    // Active if JSONL file modified in last 30 seconds
    let status: 'active' | 'idle' = 'idle';
    try {
      const stat = statSync(session.filePath);
      const ageMs = Date.now() - stat.mtimeMs;
      if (ageMs < 30_000) status = 'active';
    } catch {
      continue; // File disappeared
    }
    agents.push({ id: session.id, folderName: session.folderName, status });
  }

  return Response.json({ agents });
}
