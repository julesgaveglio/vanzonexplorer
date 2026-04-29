import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  fullText: string;
  segments: TranscriptSegment[];
  srt: string;
}

export async function transcribeVideo(
  libraryId: string,
  videoId: string
): Promise<TranscriptionResult> {
  // Download from Bunny CDN — try lowest resolution first to stay under 25MB Groq limit
  const CDN_HOST = "vz-3eab9985-c1f.b-cdn.net";
  const REFERER = { Referer: "https://iframe.mediadelivery.net/" };
  const resolutions = ["360p", "480p", "720p"];

  let videoBuffer: ArrayBuffer | null = null;
  for (const res of resolutions) {
    const url = `https://${CDN_HOST}/${videoId}/play_${res}.mp4`;
    const dlRes = await fetch(url, { headers: REFERER });
    if (!dlRes.ok) continue;
    const buf = await dlRes.arrayBuffer();
    if (buf.byteLength / 1024 / 1024 <= 24 || res === "360p") {
      videoBuffer = buf;
      break;
    }
  }
  if (!videoBuffer) throw new Error("Video download failed: no suitable resolution");
  const videoFile = new File([videoBuffer], "video.mp4", { type: "video/mp4" });

  // 3. Send to Groq Whisper
  const transcription = await groq.audio.transcriptions.create({
    file: videoFile,
    model: "whisper-large-v3-turbo",
    language: "fr",
    response_format: "verbose_json",
  });

  // 4. Extract segments
  const segments: TranscriptSegment[] = (
    (transcription as unknown as { segments?: Array<{ start: number; end: number; text: string }> }).segments ?? []
  ).map((s) => ({
    start: s.start,
    end: s.end,
    text: s.text.trim(),
  }));

  // 5. Generate SRT
  const srt = generateSRT(segments);

  return {
    fullText: transcription.text,
    segments,
    srt,
  };
}

function generateSRT(segments: TranscriptSegment[]): string {
  return segments
    .map((seg, i) => {
      const start = formatSRTTime(seg.start);
      const end = formatSRTTime(seg.end);
      return `${i + 1}\n${start} --> ${end}\n${seg.text}\n`;
    })
    .join("\n");
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${ms.toString().padStart(3, "0")}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export async function uploadCaptionsToBunny(
  libraryId: string,
  videoId: string,
  srt: string
): Promise<void> {
  const captionsBody = {
    srclang: "fr",
    label: "Français",
    captionsFile: Buffer.from(srt).toString("base64"),
  };

  const res = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}/captions/fr`,
    {
      method: "POST",
      headers: {
        AccessKey: process.env.BUNNY_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(captionsBody),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Bunny captions upload failed: ${res.status} — ${body}`);
  }
}
