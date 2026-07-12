import { sendViaGmail } from "../src/lib/gmail/client";
import * as fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf-8");
for (const line of envContent.split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length > 0 && !key.startsWith("#")) {
    process.env[key.trim()] = rest.join("=").trim();
  }
}

const OT_TARGETS = [
  {
    name: "Office de Tourisme de Cambo-les-Bains",
    email: "info@cambolesbains.com",
    ville: "Cambo-les-Bains",
  },
  {
    name: "Office de Tourisme de Bayonne",
    email: "info@visitbayonne.com",
    ville: "Bayonne",
  },
  {
    name: "Office de Tourisme de Biarritz",
    email: "info@biarritz-tourisme.com",
    ville: "Biarritz",
  },
  {
    name: "Office de Tourisme de Saint-Jean-de-Luz",
    email: "info@saintjeandeluz.com",
    ville: "Saint-Jean-de-Luz",
  },
];

async function main() {
  for (const ot of OT_TARGETS) {
    try {
      const result = await sendViaGmail({
        to: ot.email,
        subject: `Location de vans aménagés au départ de Cambo-les-Bains — référencement sur votre site`,
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
      console.log(`✅ ${ot.name} (${ot.email}) — envoyé (${result.messageId})`);
    } catch (e: any) {
      console.error(`❌ ${ot.name} (${ot.email}) — erreur: ${e.message}`);
    }

    // Pause 3s entre chaque envoi pour éviter le rate limit
    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log("\n🎉 Tous les emails OT envoyés !");
}

main().catch((e) => { console.error("FATAL", e.message); process.exit(1); });
