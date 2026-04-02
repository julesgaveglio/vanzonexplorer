// src/lib/vanzon-memory/types.ts

export interface MemorySavePayload {
  action_type:   "memory_save";
  transcript:    string;       // transcription brute Whisper — conservée pour le flow Modifier
  obsidian_file: string;       // chemin relatif ex: "vans/🚐 Yoni.md"
  category:      string;       // ex: "vans", "blog", "equipe"
  title:         string;       // titre court généré par Groq
  content:       string;       // markdown formaté prêt à appender
  tags:          string[];
}

export interface MemoryNote {
  id:                 string;
  category:           string;
  obsidian_file:      string;
  title:              string;
  content:            string;
  source:             string;
  tags:               string[];
  obsidian_synced_at: string | null;
  created_at:         string;
}

export interface CategorizerResult {
  category:      string;
  obsidian_file: string;
  title:         string;
  content:       string;
  tags:          string[];
}
