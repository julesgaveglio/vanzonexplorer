import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";
config({ path: path.resolve(__dirname, "../.env.local") });

const BUNNY_API_KEY = process.env.BUNNY_API_KEY || "d29595b9-ffc0-42ee-ad46d32759fb-76f5-4143";
const BUNNY_LIBRARY_ID = "642396";
const VBA = "/Users/julesgaveglio/Desktop/Projets/Vanzon 🚐/Formation/Van Business Academy";

const FAILED = [
  { videoId: "0d1ee938-4287-4b5e-838d-d405f8a26973", file: `${VBA}/Module 2/Vidéo 7 - Technique pour tester l'embrayage.MOV` },
  { videoId: "4749a413-da98-47b4-baa8-7e9457438795", file: `${VBA}/Module 3/Vidéo 5 - Airtable, L'outil pour tout organiser, acheter et suivre facileme.mov` },
  { videoId: "f5514e9e-0434-428e-80d2-810407b6569c", file: `${VBA}/Module 4/Vidéo 1 - Présentation de l'aménagement VASP L1H1.mov` },
  { videoId: "34fb4564-e4c7-4b6e-8a17-2d9ed6ea5be7", file: `${VBA}/Module 5 - Les travaux/Vidéo 2 - La pose de la fenêtre.mov` },
  { videoId: "9a2d441c-7126-4734-ae57-4bc48dcb41f0", file: `${VBA}/Module 5 - Les travaux/Vidéo 8 - Bricolage  meubles.mov` },
  { videoId: "49055ed6-ce0b-44a7-b73c-e24a1264605a", file: `${VBA}/Module 6 - Électricité/Vidéo 1 - Introduction Elec.mov` },
];

async function main() {
  for (const { videoId, file } of FAILED) {
    const name = path.basename(file);
    const size = (fs.statSync(file).size / 1048576).toFixed(0);
    console.log(`📤 Retry: ${name} (${size} MB) → ${videoId}`);
    try {
      const buf = fs.readFileSync(file);
      const res = await fetch(
        `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
        { method: "PUT", headers: { AccessKey: BUNNY_API_KEY, "Content-Type": "application/octet-stream" }, body: buf }
      );
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      console.log(`✅ OK\n`);
    } catch (e) {
      console.error(`❌ ${(e as Error).message}\n`);
    }
  }
  console.log("🎉 Retry terminé");
}
main();
