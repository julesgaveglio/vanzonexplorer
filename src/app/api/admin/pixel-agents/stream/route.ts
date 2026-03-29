// import type is erased at compile time — safe even with the runtime guard below
import type { FSWatcher } from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Guard local-only — before any effective fs import
  if (process.env.NODE_ENV !== 'development') {
    return new Response(null, { status: 404 });
  }

  // Dynamic named imports after guard (avoids bundling on Vercel)
  const { statSync, openSync, readSync, closeSync, watch } = await import('fs');
  const { buildInitMessages } = await import('@/lib/pixel-agents/assetLoader');
  const { findActiveJsonlFiles, parseJsonlLine } = await import('@/lib/pixel-agents/jsonlParser');

  const encoder = new TextEncoder();
  const abortSignal = request.signal;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Stream already closed
        }
      };

      // Cleanup registry
      const watchers: FSWatcher[] = [];
      const intervals: ReturnType<typeof setInterval>[] = [];

      const cleanup = () => {
        watchers.forEach((w) => { try { w.close(); } catch {} });
        intervals.forEach((i) => clearInterval(i));
        watchers.length = 0;
        intervals.length = 0;
      };

      abortSignal.addEventListener('abort', () => {
        cleanup();
        try { controller.close(); } catch {}
      });

      // 1. Send assets (init)
      try {
        const initMessages = buildInitMessages();
        for (const msg of initMessages) {
          send(msg);
        }
      } catch (e) {
        console.warn('[pixel-agents SSE] Failed to load assets:', e);
      }

      // 2. Find active JSONL sessions and send agentCreated
      const sessions = findActiveJsonlFiles();
      const fileOffsets = new Map<number, number>(); // agentId → bytes read

      for (const session of sessions) {
        send({ type: 'agentCreated', id: session.id, folderName: session.folderName });

        // Initialize offset to end of file (don't replay history)
        try {
          const stat = statSync(session.filePath);
          fileOffsets.set(session.id, stat.size);
        } catch {
          fileOffsets.set(session.id, 0);
        }
      }

      // 3. Watcher + polling per session
      for (const session of sessions) {
        const { id, filePath } = session;
        let debounceTimer: ReturnType<typeof setTimeout> | null = null;

        const readNewLines = () => {
          try {
            const stat = statSync(filePath);
            const offset = fileOffsets.get(id) ?? stat.size;
            if (stat.size <= offset) return;

            const buffer = Buffer.alloc(stat.size - offset);
            const fd = openSync(filePath, 'r');
            readSync(fd, buffer, 0, buffer.length, offset);
            closeSync(fd);
            fileOffsets.set(id, stat.size);

            const newContent = buffer.toString('utf-8');
            const lines = newContent.split('\n');
            for (const line of lines) {
              const events = parseJsonlLine(id, line);
              for (const event of events) {
                send(event);
              }
            }
          } catch {
            // File deleted or unreadable
            send({ type: 'agentClosed', id });
          }
        };

        const debouncedRead = () => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(readNewLines, 100);
        };

        try {
          const watcher = watch(filePath, debouncedRead);
          watchers.push(watcher);
        } catch {
          // fs.watch not supported on this path
        }

        // Fallback polling every 2s
        const pollInterval = setInterval(readNewLines, 2000);
        intervals.push(pollInterval);
      }

      // Keepalive every 30s to prevent disconnection
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          clearInterval(keepalive);
        }
      }, 30000);
      intervals.push(keepalive);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
