#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const article = {
  title: "Club Privé Vanzon Explorer : comment les vanlifers économisent vraiment sur leur équipement",
  target_url: "https://vanzonexplorer.com/club",
  excerpt: "Aménager un van coûte cher — mais pas obligatoirement. Le Club Privé Vanzon Explorer donne accès à des deals exclusifs sur l'équipement van, gratuitement depuis mars 2026.",
  html_content: `<h1>Club Privé Vanzon Explorer : comment les vanlifers économisent vraiment sur leur équipement</h1>

<p>Aménager un van, ça coûte cher. Pas parce que les matériaux sont rares ou que les équipements sont luxueux — mais parce que la plupart des vanlifers achètent au détail, sans accès aux tarifs négociés, et souvent au mauvais moment. Résultat : le même panneau solaire, la même mousse d'isolation ou le même convertisseur de tension peut revenir 30 à 50 % moins cher selon où vous l'achetez. C'est là que le Club Privé Vanzon Explorer intervient — pas comme un gadget marketing, mais comme une réponse concrète à un problème réel.</p>

<h2>Le vrai coût d'un van aménagé : où passe l'argent ?</h2>

<p>Un aménagement van complet tourne en général entre 4 000 et 15 000 €, selon le niveau de finition et les équipements choisis. On peut découper ce budget en grandes catégories :</p>

<ul>
  <li><strong>Isolation thermique et phonique</strong> : laine de lin, mousse Armaflex, pare-vapeur… comptez entre 400 et 900 € pour un Sprinter standard.</li>
  <li><strong>Électricité embarquée</strong> : batterie lithium 100 Ah, régulateur MPPT, onduleur, câblage — facilement 1 200 à 2 500 € selon la configuration.</li>
  <li><strong>Menuiserie et mobilier</strong> : bois contreplaqué, visserie, charnières, plan de travail — entre 600 et 2 000 €.</li>
  <li><strong>Accessoires et finitions</strong> : ventilation (Maxxair, Fan-Tastic), éclairage LED, rideaux occultants, serrure de sécurité — encore 500 à 1 000 €.</li>
</ul>

<p>Ces chiffres sont des moyennes. Ils peuvent exploser dès qu'on passe sur des marques premium ou qu'on commande en urgence sans comparer les prix. Et c'est exactement là que le budget dérape.</p>

<h2>Pourquoi les vanlifers paient trop cher</h2>

<p>Il n'y a pas de mystère là-dedans. La majorité des constructeurs de vans amateurs achètent leurs matériaux dans les grandes surfaces de bricolage ou sur des plateformes généralistes. Ce sont des canaux pratiques, mais rarement les moins chers pour du matériel technique spécialisé.</p>

<p>Trois raisons principales expliquent cette surpaye :</p>

<ul>
  <li><strong>L'absence de tarifs professionnels</strong> : les grossistes et fournisseurs spécialisés proposent des remises significatives aux professionnels du secteur — carrossiers, aménageurs, loueurs. Les particuliers n'y ont normalement pas accès.</li>
  <li><strong>Les achats en retail au prix fort</strong> : un panneau solaire 200 W acheté en grande surface peut coûter 180 à 220 €. Le même modèle via un fournisseur partenaire tourne à 130-150 €. Sur un kit complet, la différence devient substantielle.</li>
  <li><strong>Le mauvais timing</strong> : beaucoup de vanlifers achètent dans l'urgence, sans avoir anticipé les périodes de déstockage, les promos fournisseurs ou les lots groupés.</li>
</ul>

<p>Ce n'est pas une question de compétence ou d'intelligence — c'est simplement une question d'accès à l'information et aux bons réseaux.</p>

<h2>Le Club Privé Vanzon Explorer — qu'est-ce que c'est concrètement ?</h2>

<p>Le <a href="https://vanzonexplorer.com/club">Club Privé Vanzon Explorer</a> est une plateforme d'accès à des tarifs négociés sur l'équipement van. Jules Gaveglio et Elio, les deux fondateurs de Vanzon, ont passé du temps à nouer des partenariats directs avec des marques spécialisées dans l'aménagement de véhicules aménagés — isolation, énergie solaire, mobilier, accessoires.</p>

<p>Concrètement, les membres du Club accèdent à :</p>

<ul>
  <li>Des <strong>codes de réduction exclusifs</strong> chez les marques partenaires, non disponibles en public.</li>
  <li>Des <strong>offres ponctuelles</strong> sur du matériel spécifique — déstockages, lots, nouveautés à tarif préférentiel.</li>
  <li>Des <strong>tarifs proches du prix professionnel</strong> sur des équipements électriques et matériaux d'isolation.</li>
</ul>

<p>Ce n'est pas une marketplace ni un comparateur de prix. C'est un accès privilégié à des partenariats que Vanzon a négociés collectivement, et qu'ils redistribuent à leur communauté. L'idée : mutualiser le pouvoir de négociation pour que chaque membre bénéficie de conditions que personne n'obtiendrait seul en achetant à l'unité.</p>

<h2>Gratuit depuis mars 2026 — pourquoi Vanzon a supprimé l'abonnement</h2>

<p>Jusqu'en mars 2026, l'accès au Club Privé était payant — 9,99 € par mois. Un tarif raisonnable, mais qui créait malgré tout une barrière à l'entrée pour les vanlifers avec un budget serré, justement ceux qui avaient le plus besoin de ces réductions.</p>

<p>La décision de passer à <strong>un accès 100 % gratuit</strong> n'est pas un coup marketing. C'est une décision de fond, cohérente avec le slogan de Vanzon : <em>"Rendre accessible à tous le goût de la liberté."</em> Si l'objectif est de démocratiser la vanlife, facturer l'accès aux outils qui la rendent financièrement viable allait à l'encontre de cette logique.</p>

<p>Aujourd'hui, <a href="https://vanzonexplorer.com/club">rejoindre le Club Privé</a> ne coûte rien. Aucun abonnement, aucune carte de crédit requise. Les partenariats sont maintenus via d'autres leviers commerciaux côté Vanzon — la location de vans, les formations, les collaborations marques — ce qui permet de garder les deals accessibles sans faire payer la communauté.</p>

<h2>Pour qui c'est utile ?</h2>

<p>Le Club Privé s'adresse à plusieurs profils bien distincts :</p>

<ul>
  <li><strong>Les constructeurs amateurs</strong> qui aménagent leur propre van et veulent optimiser leur budget sans sacrifier la qualité des matériaux. Pour eux, économiser 20 à 30 % sur l'isolation et l'électricité peut représenter plusieurs centaines d'euros réinvestis ailleurs.</li>
  <li><strong>Les propriétaires qui mettent leur van en location</strong> (via Yescapa, Wikicampers ou en direct) : l'entretien et la mise à niveau du véhicule est un coût récurrent. Accéder à des tarifs préférentiels sur les accessoires et équipements change le calcul de rentabilité.</li>
  <li><strong>Les nomades digitaux et vanlifers à temps plein</strong> qui équipent ou rénovent leur van au fil du temps. Un accès permanent aux deals leur permet d'acheter au bon moment plutôt qu'en urgence.</li>
  <li><strong>Les membres VBA (Van Business Academy)</strong> : le Club est également accessible aux participants de la formation, ce qui en fait un prolongement naturel pour ceux qui construisent un projet van professionnel.</li>
</ul>

<p>Dans tous les cas, le Club n'est pertinent que si on a des achats d'équipement à faire. Ce n'est pas une communauté sociale ou un forum — c'est un outil d'accès à des tarifs. Simple, direct, utile.</p>

<h2>Conclusion</h2>

<p>Le coût de l'équipement van n'est pas une fatalité. Il est en grande partie le résultat d'un accès fragmenté à l'information et aux fournisseurs. Le Club Privé Vanzon Explorer ne révolutionne pas la vanlife — il corrige une inefficacité simple : le fait que des particuliers paient retail ce qui pourrait être acheté à tarif négocié.</p>

<p>Le fait que ce soit désormais entièrement gratuit supprime le dernier frein logique à l'inscription. Si vous avez un projet d'aménagement, une rénovation à planifier ou simplement des achats d'équipement dans les prochains mois, il n'y a aucune raison de ne pas y jeter un œil.</p>

<p><a href="https://vanzonexplorer.com/club">Accéder au Club Privé Vanzon Explorer</a> — sans abonnement, sans engagement.</p>`,
};

async function main() {
  const { data, error } = await supabase
    .from("draft_articles")
    .insert(article)
    .select("id, title")
    .single();

  if (error) { console.error("❌", error.message); process.exit(1); }
  console.log("✅ Article inséré :", data.id);
  console.log("   Titre :", data.title);
}

main().catch(console.error);
