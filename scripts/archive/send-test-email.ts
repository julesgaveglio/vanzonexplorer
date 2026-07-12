import { sendViaGmail } from "../src/lib/gmail/client";
import * as fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf-8");
for (const line of envContent.split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length > 0 && !key.startsWith("#")) {
    process.env[key.trim()] = rest.join("=").trim();
  }
}

async function main() {
  const to = process.argv[2] || "gavegliojules@gmail.com";
  const subject = process.argv[3] || "Location de vans aménagés au départ de Cambo-les-Bains — référencement sur votre site";

  const result = await sendViaGmail({
    to,
    subject,
    textBody: `Bonjour,

Je suis Jules Gaveglio, fondateur de Vanzon Explorer, une entreprise de location de vans aménagés basée à Cambo-les-Bains (64250).

Nous proposons deux fourgons tout équipés pour découvrir le Pays Basque et le Sud-Ouest, au départ de Cambo-les-Bains. Nos vans sont disponibles toute l'année, à partir de 65€/nuit.

Nous avons également développé un générateur d'itinéraires road trip gratuit sur notre site (vanzonexplorer.com/road-trip-personnalise), qui aide les visiteurs à planifier leur séjour au Pays Basque.

Serait-il possible d'être référencés dans votre rubrique hébergements, transports ou activités de plein air ? Nous pensons que notre offre complète bien l'écosystème touristique local.

Je suis disponible par téléphone ou par email si vous souhaitez en discuter.

Merci pour votre temps,
Jules Gaveglio
Vanzon Explorer
jules@vanzonexplorer.com
vanzonexplorer.com`,
  });
  console.log("✅ Email envoyé à", to, JSON.stringify(result));
}
main().catch((e) => { console.error("❌", e.message); process.exit(1); });
