/**
 * Parse les fichiers JSONL de sessions Claude Code
 * et retourne les événements pixel-agents correspondants.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface AgentEvent {
  type: string;
  id: number;
  [key: string]: unknown;
}

/** Trouve les fichiers JSONL actifs dans ~/.claude/projects/ */
export function findActiveJsonlFiles(): Array<{ id: number; filePath: string; projectDir: string; folderName: string }> {
  const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
  if (!fs.existsSync(claudeProjectsDir)) return [];

  const results: Array<{ id: number; filePath: string; projectDir: string; folderName: string }> = [];
  let agentId = 1;

  try {
    const projectDirs = fs.readdirSync(claudeProjectsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory());

    for (const dir of projectDirs) {
      const projectPath = path.join(claudeProjectsDir, dir.name);
      try {
        const jsonlFiles = fs.readdirSync(projectPath)
          .filter((f) => f.endsWith('.jsonl'))
          .map((f) => ({
            file: f,
            mtime: fs.statSync(path.join(projectPath, f)).mtimeMs,
          }))
          .sort((a, b) => b.mtime - a.mtime); // plus récent en premier

        if (jsonlFiles.length > 0) {
          // Décoder le nom du dossier de projet (URL-encoded path)
          const folderName = decodeURIComponent(dir.name).split(/[\\/]/).pop() ?? dir.name;
          results.push({
            id: agentId++,
            filePath: path.join(projectPath, jsonlFiles[0].file),
            projectDir: projectPath,
            folderName,
          });
        }
      } catch {
        // Ignorer les dossiers illisibles
      }
    }
  } catch {
    // Ignorer si ~/.claude/projects n'est pas accessible
  }

  return results;
}

/** Parse une ligne JSONL et retourne les événements pixel-agents correspondants */
export function parseJsonlLine(agentId: number, line: string): AgentEvent[] {
  if (!line.trim()) return [];
  const events: AgentEvent[] = [];

  try {
    const record = JSON.parse(line);
    const assistantContent = record.message?.content ?? record.content;

    if (record.type === 'assistant' && Array.isArray(assistantContent)) {
      const hasToolUse = assistantContent.some((b: { type: string }) => b.type === 'tool_use');
      if (hasToolUse) {
        events.push({ type: 'agentStatus', id: agentId, status: 'active' });
        for (const block of assistantContent as Array<{ type: string; id?: string; name?: string; input?: Record<string, unknown> }>) {
          if (block.type === 'tool_use' && block.id) {
            const toolName = block.name ?? '';
            events.push({ type: 'agentToolStart', id: agentId, toolId: block.id, toolName, status: `Using ${toolName}` });
          }
        }
      } else {
        events.push({ type: 'agentStatus', id: agentId, status: 'idle' });
      }
    }

    if (record.type === 'user' && Array.isArray(assistantContent)) {
      for (const block of assistantContent as Array<{ type: string; tool_use_id?: string }>) {
        if (block.type === 'tool_result' && block.tool_use_id) {
          events.push({ type: 'agentToolDone', id: agentId, toolId: block.tool_use_id });
        }
      }
    }

    if (record.type === 'system' && record.subtype === 'turn_duration') {
      events.push({ type: 'agentToolsClear', id: agentId });
      events.push({ type: 'agentStatus', id: agentId, status: 'idle' });
    }
  } catch {
    // Ignorer les lignes JSONL malformées
  }

  return events;
}
