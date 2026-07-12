import { sendViaGmail } from "../src/lib/gmail/client";
import * as fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf-8");
for (const line of envContent.split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length > 0 && !key.startsWith("#")) {
    process.env[key.trim()] = rest.join("=").trim();
  }
}

const TARGETS = [
  {
    name: "Biarritz Camping",
    email: "biarritz.camping@gmail.com",
  },
  {
    name: "Camping Itsas Mendi (Saint-Jean-de-Luz)",
    email: "contact@itsas-mendi.com",
  },
  {
    name: "Camping Inter-Plages (Saint-Jean-de-Luz)",
    email: "contact@inter-plages.com",
  },
  {
    name: "Camping Larrouleta (Urrugne)",
    email: "info@larrouleta.com",
  },
];

async function main() {
  for (const target of TARGETS) {
    try {
      const result = await sendViaGmail({
        to: target.email,
        subject: "Partenariat local — location de vans aménagés Vanzon Explorer",
        textBody: `Bonjour,

Je suis Jules Gaveglio, fondateur de Vanzon Explorer. Nous louons des vans aménagés au départ de Cambo-les-Bains, et nos locataires cherchent régulièrement des campings et aires d'accueil dans le Pays Basque.

Je vous contacte pour vous proposer un partenariat simple :

• On recommande votre camping à nos locataires (dans nos guides et notre générateur d'itinéraires sur vanzonexplorer.com/road-trip-personnalise)
• En échange, vous mentionnez Vanzon Explorer comme option de location de van locale sur votre site ou à vos clients

Pas de frais, pas de contrat compliqué. Juste deux acteurs locaux qui se renvoient des clients.

Si l'idée vous intéresse, on peut en discuter par téléphone. Je suis disponible cette semaine.

Cordialement,
Jules Gaveglio
Vanzon Explorer — Location de vans aménagés au Pays Basque
jules@vanzonexplorer.com
vanzonexplorer.com`,
      });
      console.log(`✅ ${target.name} (${target.email}) — envoyé (${result.messageId})`);
    } catch (e: any) {
      console.error(`❌ ${target.name} (${target.email}) — erreur: ${e.message}`);
    }

    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log("\n🎉 Tous les emails campings envoyés !");
}

main().catch((e) => { console.error("FATAL", e.message); process.exit(1); });
