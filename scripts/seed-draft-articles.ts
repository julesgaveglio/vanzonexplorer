#!/usr/bin/env tsx
/**
 * seed-draft-articles.ts
 * Insère les 3 articles de backlink générés dans la table draft_articles.
 *
 * Usage:
 *   npx tsx scripts/seed-draft-articles.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const articles = [
  {
    title: "Van Business Academy : comment transformer un van aménagé en actif qui rapporte (chiffres réels)",
    target_url: "https://vanzonexplorer.com/formation",
    excerpt: "Acheter un van, l'aménager, le louer — la méthode structurée pour éviter les 3 erreurs classiques et dégager 6 000 à 9 000€ de plus-value.",
    html_content: `<h1>Van Business Academy : comment transformer un van aménagé en actif qui rapporte (chiffres réels)</h1>

<p>Acheter un van, l'aménager, le louer. Sur le papier, la mécanique est simple. Dans les faits, la majorité des projets s'arrêtent avant même la première réservation — non pas par manque de motivation, mais parce que trois décisions prises en début de parcours condamnent le projet avant qu'il commence.</p>

<p>Ce que propose la <strong>Van Business Academy</strong> développée par Vanzon Explorer, c'est une méthode pour éviter ces erreurs — et construire un actif locatif cohérent, homologué, et rentable sur le long terme.</p>

<h2>Le problème que la plupart des gens ignorent</h2>

<p>Trois erreurs reviennent systématiquement chez ceux qui se lancent seuls :</p>

<ul>
  <li><strong>Le mauvais achat.</strong> Trop neuf (marge réduite), trop usé (fiabilité compromise), mauvaise base pour l'aménagement. Le kilométrage optimal à l'achat tourne autour de <strong>100 000 km</strong> : assez roulé pour être décoté, assez récent pour être fiable.</li>
  <li><strong>Les mauvais matériaux.</strong> Un aménagement beau sur Instagram mais qui ne passe pas les normes de sécurité. Résultat : impossible à homologuer, donc impossible à louer légalement — ou pire, à revendre correctement.</li>
  <li><strong>L'aménagement non homologué.</strong> C'est le point le plus sous-estimé. Sans la mention <strong>VASP</strong> (Véhicule Aménagé à Usage Spécial) sur la carte grise, la valeur du van chute de 5 000€ minimum à la revente. Et la plupart des plateformes de location sérieuses l'exigent.</li>
</ul>

<p>Ces trois erreurs ne sont pas des détails. Elles déterminent l'intégralité de l'équation financière du projet.</p>

<h2>Les 4 étapes clés du processus</h2>

<p>La méthode VBA suit une logique séquentielle précise, conçue pour ne pas brûler les étapes :</p>

<ol>
  <li><strong>L'achat stratégique.</strong> Identifier le bon véhicule au bon kilométrage, dans une fourchette permettant une marge réelle. Le choix de la base conditionne tout : la facilité d'aménagement, la capacité à obtenir le VASP, et la valeur de revente.</li>
  <li><strong>L'aménagement contrôlé.</strong> Budget plafonné à <strong>5 000€</strong> maximum. Pas pour rogner sur la qualité, mais pour préserver la rentabilité. L'aménagement doit être pensé pour le locataire (ergonomie, robustesse) et pour l'homologation (matériaux conformes, installations électriques aux normes).</li>
  <li><strong>L'homologation VASP.</strong> L'étape que beaucoup sautent parce qu'elle semble complexe. Elle est pourtant centrale — on y revient en détail ci-dessous.</li>
  <li><strong>La mise en location.</strong> Référencement sur les plateformes, calibrage du prix, gestion des disponibilités. Avec un van correctement positionné, les revenus nets annuels se situent entre <strong>5 000 et 9 000€</strong>.</li>
</ol>

<p>Avec la méthode structurée de la <a href="https://vanzonexplorer.com/formation">Van Business Academy</a>, ce parcours prend environ <strong>3 mois</strong>. Sans accompagnement, les retours de terrain montrent des délais de 6 à 8 mois — avec plus de risques d'erreurs coûteuses en chemin.</p>

<h2>Les chiffres réels</h2>

<ul>
  <li>Revenus locatifs nets annuels : <strong>5 000 à 9 000€</strong></li>
  <li>Plus-value à la revente (van aménagé + VASP) : <strong>6 000 à 9 000€</strong> par rapport au prix d'achat + aménagement</li>
  <li>Durée avant première location : <strong>3 mois</strong> avec la méthode</li>
  <li>Budget aménagement : <strong>5 000€ maximum</strong></li>
</ul>

<h2>L'homologation VASP, le levier méconnu</h2>

<p>Le VASP est la mention qui change tout sur la carte grise d'un véhicule aménagé. Son impact financier est direct :</p>

<table>
  <thead><tr><th>Situation</th><th>Prix de revente estimé</th></tr></thead>
  <tbody>
    <tr><td>Van aménagé <strong>avec</strong> homologation VASP</td><td>25 000 à 30 000€</td></tr>
    <tr><td>Van aménagé <strong>sans</strong> homologation VASP</td><td>20 000 à 25 000€</td></tr>
    <tr><td><strong>Écart</strong></td><td><strong>+5 000€ minimum</strong></td></tr>
  </tbody>
</table>

<p>5 000€ de plus-value pour une démarche administrative que la plupart évitent par méconnaissance. C'est un des axes centraux de la <a href="https://vanzonexplorer.com/formation">formation Van Business Academy</a>.</p>

<h2>Pour qui c'est fait</h2>

<p>La Van Business Academy n'est pas un programme pour "devenir riche avec un van". C'est un projet qui demande un investissement initial, du temps, et une vraie rigueur d'exécution. Le profil qui correspond :</p>

<ul>
  <li>Quelqu'un qui veut créer un actif locatif tangible, pas une activité principale</li>
  <li>Une personne prête à suivre une méthode structurée plutôt qu'à improviser</li>
  <li>Quelqu'un qui comprend que la rentabilité se construit sur 12 à 24 mois, pas en 3 semaines</li>
</ul>

<p>La différence entre un projet qui aboutit et un van qui prend la poussière dans un parking n'est pas une question de chance. C'est une question de séquençage. Chacune des étapes est documentée dans la <a href="https://vanzonexplorer.com/formation">Van Business Academy de Vanzon Explorer</a>.</p>`,
  },
  {
    title: "Comment planifier un itinéraire van personnalisé en France (et arrêter de copier les mêmes \"top 10\")",
    target_url: "https://vanzonexplorer.com/road-trip-personnalise",
    excerpt: "Arrêtez de copier les mêmes listes génériques. Voici comment planifier un road trip en van vraiment sur-mesure avec les bons outils.",
    html_content: `<h1>Comment planifier un itinéraire van personnalisé en France (et arrêter de copier les mêmes "top 10")</h1>

<p>Soyons honnêtes : la plupart des guides de road trip se ressemblent. Même liste de spots Instagram. Mêmes étapes "incontournables". Mêmes parkings bondés en juillet. Si vous avez déjà passé une soirée à compiler des listes Pinterest pour finalement repartir avec un itinéraire qui ne vous ressemble pas vraiment, vous savez exactement de quoi on parle.</p>

<p>Un road trip en van, c'est justement l'inverse de ça. C'est partir avec vos propres priorités, votre rythme, vos envies profondes. Le problème, c'est que <strong>planifier un itinéraire vraiment sur-mesure prend du temps</strong>. À moins d'avoir les bons outils.</p>

<h2>Pourquoi le road trip sur-mesure change tout</h2>

<p>Un couple d'aventuriers qui veut dormir en altitude chaque nuit et un père de famille cherchant des campings avec piscine et terrain de jeux n'ont absolument pas le même voyage idéal — et pourtant, les deux pourraient se retrouver à parcourir les mêmes guides génériques.</p>

<p>La personnalisation d'un itinéraire van, c'est d'abord une question de <strong>profil voyageur</strong> :</p>

<ul>
  <li>Votre appétit pour l'aventure vs le confort</li>
  <li>Le nombre de jours disponibles (4 jours ou 3 semaines, ça ne se planifie pas pareil)</li>
  <li>Vos centres d'intérêt : gastronomie locale, randonnée, patrimoine, plages, vie sauvage</li>
  <li>Votre région de départ et les contraintes de distance</li>
</ul>

<h2>Comment fonctionne le générateur d'itinéraires Vanzon Explorer</h2>

<p>L'équipe de Vanzon Explorer — basée à Cambo-les-Bains au cœur du Pays Basque — a développé un outil gratuit qui s'attaque justement à ce problème. <a href="https://vanzonexplorer.com/road-trip-personnalise">Le générateur de road trip personnalisé</a> fonctionne comme un assistant de voyage : il vous pose les bonnes questions, puis construit un itinéraire cohérent à partir de vos réponses.</p>

<p>Le processus se déroule en quelques étapes simples :</p>

<ul>
  <li><strong>La région :</strong> Bretagne, Alpes, Pyrénées, Provence, Côte Atlantique — vous choisissez votre terrain de jeu</li>
  <li><strong>La durée :</strong> de quelques jours à plusieurs semaines, le générateur adapte le rythme et le nombre d'étapes</li>
  <li><strong>Vos intérêts :</strong> randonnée, surf, gastronomie, patrimoine, nature sauvage, villages authentiques</li>
  <li><strong>Votre profil voyageur :</strong> solo, en couple, en famille, nomade confirmé ou premier van trip</li>
</ul>

<p>À partir de ces données, l'outil génère un itinéraire complet avec des étapes concrètes, des spots recommandés et une logique de parcours géographiquement cohérente. C'est gratuit, immédiat, et l'un des rares outils de ce type disponibles en France pour les van-lifers.</p>

<h2>Trois exemples d'itinéraires selon votre profil</h2>

<p><strong>Le couple aventurier (10 jours, Pyrénées)</strong><br>
Départ de Pau, montée vers le Cirque de Gavarnie, bivouac au lac de Caillauas, descente vers la Cerdagne et les Orgues d'Ille-sur-Têt, retour par le Conflent. Peu de campings, beaucoup d'altitude.</p>

<p><strong>La famille avec jeunes enfants (7 jours, Bretagne)</strong><br>
Base arrière à Carnac, excursion en kayak de mer dans le Golfe du Morbihan, étape à la presqu'île de Crozon, baignade à Morgat. Priorité : étapes courtes, plages sécurisées, services à proximité.</p>

<p><strong>Le solo nomade (3 semaines, France intérieure)</strong><br>
Évite les côtes en été, remonte par le Massif Central, bivouac dans les gorges du Tarn, traversée de l'Aubrac. Rythme lent, destinations hors radar touristique.</p>

<h2>S'inspirer avec le catalogue d'itinéraires avant de personnaliser</h2>

<p>Vous n'avez pas encore d'idée de région ? Avant de lancer le générateur, il peut être utile de feuilleter <a href="https://vanzonexplorer.com/road-trip">le catalogue d'itinéraires van de Vanzon Explorer</a> pour s'inspirer. Le catalogue regroupe des parcours concrets par région avec des guides pratiques.</p>

<h2>Finissez par la bonne question</h2>

<p>Avant de chercher "road trip van France" sur Google, posez-vous la vraie question : <strong>qu'est-ce que vous voulez vivre, concrètement, pendant ce voyage ?</strong></p>

<ul>
  <li><a href="https://vanzonexplorer.com/road-trip-personnalise">Générer votre itinéraire van personnalisé</a> — gratuit, immédiat, calibré sur vos critères</li>
  <li><a href="https://vanzonexplorer.com/road-trip">Explorer le catalogue d'itinéraires van en France</a> — pour s'inspirer et affiner votre destination</li>
</ul>`,
  },
  {
    title: "Location de van aménagé au Pays Basque : le guide complet pour un road trip inoubliable",
    target_url: "https://vanzonexplorer.com/location",
    excerpt: "Découvrez comment louer un van aménagé au Pays Basque depuis Cambo-les-Bains et explorez Biarritz, Bayonne, Irati et les Pyrénées à votre rythme.",
    html_content: `<h1>Location de van aménagé au Pays Basque : le guide complet pour un road trip inoubliable</h1>

<p>Oubliez la chambre d'hôtel vue sur parking et le camping où les tentes se touchent à 30 centimètres. Le Pays Basque mérite mieux que ça. Ici, la liberté a une autre saveur : celle du réveil face à l'Atlantique, du café chaud avalé sur le marche-pied avant d'attraper une vague à Biarritz, ou de la nuit bercée par le vent de la montagne après une journée dans la forêt d'Irati. La <strong>location de van aménagé au Pays Basque</strong> n'est pas juste un mode de transport — c'est une façon de vivre le territoire autrement, à votre rythme, sans contrainte.</p>

<h2>Pourquoi le Pays Basque est parfait pour un road trip en van</h2>

<p>Peu de régions en France offrent une telle densité d'expériences sur un aussi petit territoire. En partant de Cambo-les-Bains — cœur du Pays Basque intérieur — vous êtes à <strong>20 minutes de Biarritz et de Bayonne</strong>, à 30 minutes de Saint-Jean-de-Luz et ses ruelles colorées, à 45 minutes des vagues mythiques d'Hossegor, et à une heure à peine des hauteurs sauvages de la forêt d'Irati.</p>

<p>Cette géographie extraordinaire, c'est précisément ce qui rend le van si pertinent ici. Pas besoin de choisir entre la montagne et l'océan : vous dormez au bord des Pyrénées le lundi, vous surfez le mardi, vous dégustez des pintxos à Bayonne le mercredi.</p>

<h2>Yoni et Xalbat : les vans Vanzon Explorer</h2>

<p>Derrière <a href="https://vanzonexplorer.com/location">Vanzon Explorer</a> se trouvent Jules et Elio, deux fondateurs qui ne font pas semblant de connaître le territoire : Jules a grandi au Pays Basque depuis l'âge de 4 ans. La flotte est à leur image — petite, soignée, authentique.</p>

<p><strong>Yoni</strong>, le van vert, est le premier né de l'aventure. Jules y a lui-même dormi pendant les Fêtes de Bayonne — une expérience qu'il recommande à quiconque veut vivre cet événement à fond, sans stress de logement ni de retour.</p>

<p><strong>Xalbat</strong>, le van blanc, est arrivé ensuite. Son nom ? Celui du chat de Jules. Un prénom basque — prononcé <em>"Chalbat"</em> — qui résume bien l'état d'esprit de Vanzon : ancré dans la culture locale, avec une touche d'humour et d'humanité. Les deux vans sont entièrement aménagés pour le voyage en autonomie. Chaque van est équipé de sacs poubelles — Vanzon sensibilise activement ses voyageurs au respect des espaces naturels.</p>

<h2>Les spots incontournables depuis Cambo-les-Bains</h2>

<ul>
  <li><strong>Biarritz (20 min)</strong> — Surf, rochers, Grande Plage, et une architecture belle époque qui détonne.</li>
  <li><strong>Bayonne (20 min)</strong> — Remparts, chocolat basque, marché du vendredi. Une nuit entière, surtout en juillet pendant les Fêtes de Bayonne.</li>
  <li><strong>Saint-Jean-de-Luz (30 min)</strong> — Port de pêche, maisons à colombages rouges, thon basque au restaurant.</li>
  <li><strong>Hossegor (45 min)</strong> — Pour les amateurs de surf. Les vagues de la Gravière sont parmi les meilleures d'Europe.</li>
  <li><strong>La forêt d'Irati (1h)</strong> — L'une des plus grandes hêtraies-sapinières d'Europe. Magique en automne. <strong>Emportez vos déchets</strong>.</li>
  <li><strong>L'Ursuya</strong> — La petite montagne visible depuis Cambo. Parfaite pour une randonnée matinale. Gardez l'œil ouvert pour apercevoir les <strong>pottoks</strong>, ces poneys basques semi-sauvages.</li>
</ul>

<h2>Conseils pratiques pour louer un van au Pays Basque</h2>

<ul>
  <li><strong>Réservez tôt en haute saison</strong> — de mi-avril à mi-septembre, la demande est forte.</li>
  <li><strong>Septembre-octobre pour les montagnes</strong> — période magnifique pour Irati et les Pyrénées, sans la foule estivale.</li>
  <li><strong>Bivouac responsable</strong> — Ne laissez aucune trace. Respectez les règles locales.</li>
</ul>

<p>Les vans Vanzon sont loués via la plateforme Yescapa, ce qui garantit une couverture assurance complète pendant toute la durée de votre location.</p>

<h2>Tarifs et comment réserver</h2>

<ul>
  <li><strong>Basse saison :</strong> 65 € / jour</li>
  <li><strong>Moyenne saison :</strong> 75 € / jour</li>
  <li><strong>Haute saison</strong> (15 avril → 15 septembre) : <strong>95 € / jour</strong></li>
</ul>

<p>Pour un week-end de trois jours hors saison, cela revient à moins de 200 € — soit souvent moins qu'une chambre d'hôtel correct sur la côte basque en été, pour une liberté incomparablement plus grande.</p>

<p>La réservation se fait directement en ligne. Consultez les disponibilités et choisissez entre Yoni et Xalbat sur <a href="https://vanzonexplorer.com/location"><strong>vanzonexplorer.com/location</strong></a>.</p>`,
  },
];

async function main() {
  console.log("🌱 Insertion des 3 articles dans draft_articles…");

  // Vérifier si la table existe
  const { error: checkErr } = await supabase.from("draft_articles").select("id").limit(1);
  if (checkErr) {
    console.error("❌ Table draft_articles introuvable. Lance d'abord la migration Supabase !");
    console.error("   Erreur:", checkErr.message);
    process.exit(1);
  }

  const { data, error } = await supabase
    .from("draft_articles")
    .insert(articles)
    .select("id, title");

  if (error) {
    console.error("❌ Erreur Supabase :", error.message);
    process.exit(1);
  }

  console.log(`✅ ${data?.length ?? 0} articles insérés :`);
  data?.forEach((a, i) => console.log(`   ${i + 1}. [${a.id}] ${a.title.slice(0, 60)}…`));
}

main().catch((e) => { console.error(e); process.exit(1); });
