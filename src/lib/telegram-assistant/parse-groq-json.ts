// src/lib/telegram-assistant/parse-groq-json.ts
// Parse robuste des réponses JSON de Groq.
// Groq retourne parfois : texte avant/après le JSON, control chars, code blocks.

export function parseGroqJson<T>(raw: string): T {
  // 1. Supprimer les blocs code markdown
  let text = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  // 2. Extraire le premier objet JSON { ... }
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Aucun objet JSON trouvé dans la réponse Groq : ${text.slice(0, 150)}`);
  }
  const jsonStr = text.slice(start, end + 1);

  // 3. Échapper les caractères de contrôle littéraux (newlines, tabs, etc.)
  const sanitized = jsonStr.replace(/[\x00-\x1F\x7F]/g, (c) => {
    const map: Record<string, string> = {
      "\n": "\\n", "\r": "\\r", "\t": "\\t", "\b": "\\b", "\f": "\\f",
    };
    return map[c] ?? "";
  });

  return JSON.parse(sanitized) as T;
}
