// src/lib/vanzon-memory/github-writer.ts
// Écrit/append des notes dans le repo GitHub via l'API Contents.
// Fonctionne depuis Vercel (serverless) — pas besoin de filesystem local.

const REPO_OWNER = "julesgaveglio";
const REPO_NAME = "vanzonexplorer";
const BRANCH = "main";
const VAULT_ROOT = "Vanzon Memory Database";

/**
 * Mapping catégorie Supabase → chemin dans le vault Obsidian.
 */
const CATEGORY_MAP: Record<string, string> = {
  clients:    "🔒 INTERNE/Van Business Academy/Clients",
  formation:  "🔒 INTERNE/Van Business Academy",
  vba:        "🔒 INTERNE/Van Business Academy",
  vision:     "🔒 INTERNE/vision",
  equipe:     "🔒 INTERNE/equipe",
  strategie:  "🔒 INTERNE/strategie",
  journal:    "🔒 INTERNE/journal",
  backlinks:  "🔒 INTERNE/backlinks",
  vans:       "🌐 PUBLIC/vans",
  anecdotes:  "🌐 PUBLIC/anecdotes",
  blog:       "🌐 PUBLIC/blog",
  histoire:   "🌐 PUBLIC/histoire",
  territoire: "🌐 PUBLIC/territorio",
  social:     "🌐 PUBLIC/social",
  marque:     "🌐 PUBLIC/marque",
};

function resolveObsidianPath(category: string, filename: string): string {
  const dir = CATEGORY_MAP[category] ?? `🔒 INTERNE/${category}`;
  return `${VAULT_ROOT}/${dir}/${filename}`;
}

function formatDate(isoString: string): string {
  return isoString.split("T")[0];
}

function buildAppendBlock(note: {
  content: string;
  transcript?: string | null;
  tags: string[];
  created_at: string;
}): string {
  const date = formatDate(note.created_at);
  const tagsLine =
    note.tags.length > 0
      ? `\n**Tags :** ${note.tags.map((t) => `#${t}`).join(" ")}`
      : "";
  const transcriptBlock = note.transcript
    ? `\n\n> [!quote]- 🎙️ Transcript original\n> ${note.transcript.replace(/\n/g, "\n> ")}`
    : "";
  return `\n---\n\n## 📝 ${date}\n\n${note.content}${tagsLine}${transcriptBlock}\n`;
}

function buildNewFile(title: string, date: string, appendBlock: string): string {
  return `# ${title}\n\n> Créé automatiquement par l'agent mémoire Vanzon — ${date}\n${appendBlock}`;
}

/**
 * Lit un fichier du repo via l'API GitHub Contents.
 * Retourne { content, sha } si le fichier existe, null sinon.
 */
async function getFileFromGitHub(
  filePath: string,
  token: string
): Promise<{ content: string; sha: string } | null> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${encodeURIComponent(filePath)}?ref=${BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub GET ${filePath}: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { content: string; sha: string };
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { content, sha: data.sha };
}

/**
 * Crée ou met à jour un fichier dans le repo via l'API GitHub Contents.
 */
async function putFileToGitHub(
  filePath: string,
  content: string,
  message: string,
  token: string,
  sha?: string
): Promise<void> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${encodeURIComponent(filePath)}`;
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content).toString("base64"),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub PUT ${filePath}: ${res.status} ${text}`);
  }
}

/**
 * Écrit une note mémoire dans le repo GitHub (append ou create).
 * Appelé depuis writer.ts après l'insert Supabase.
 */
export async function writeNoteToGitHub(note: {
  category: string;
  obsidian_file: string;
  title: string;
  content: string;
  transcript?: string | null;
  tags: string[];
  created_at: string;
}): Promise<void> {
  const token = process.env.GITHUB_PAT;
  if (!token) {
    console.warn("[github-writer] GITHUB_PAT not set — skipping GitHub write");
    return;
  }

  const filePath = resolveObsidianPath(note.category, note.obsidian_file);
  const appendBlock = buildAppendBlock(note);
  const date = formatDate(note.created_at);

  const existing = await getFileFromGitHub(filePath, token);

  if (existing) {
    // Append à la fin du fichier existant
    const newContent = existing.content + appendBlock;
    await putFileToGitHub(
      filePath,
      newContent,
      `🧠 memory: ${note.title}`,
      token,
      existing.sha
    );
  } else {
    // Créer un nouveau fichier
    const newContent = buildNewFile(note.title, date, appendBlock);
    await putFileToGitHub(filePath, newContent, `🧠 memory: ${note.title}`, token);
  }
}
