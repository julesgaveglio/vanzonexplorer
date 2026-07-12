#!/usr/bin/env tsx
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
    title: "La carte membre vanlife : comment ça marche et quels avantages concrets ?",
    target_url: "https://labelvanlife.com/",
    excerpt:
      "La carte membre Label Vanlife donne accès à un réseau de spots van-friendly certifiés en France, avec 10 à 20% de réduction sur les nuits, une carte interactive et un outil de création d'itinéraire. Une adhésion remboursée dès la première nuit.",
    html_content: `<h1>La carte membre vanlife : comment ça marche et quels avantages concrets ?</h1>

<p>La vanlife, c'est bien. La vanlife avec un réseau derrière soi, c'est mieux. Tu connais ce moment : tu arrives dans une nouvelle région, tu cherches où poser le van pour la nuit, tu scrolles sur Park4Night, tu hésites entre trois spots dont deux sont fermés et un troisième bondé. Et là tu te dis : <em>il doit bien exister un moyen plus simple.</em></p>

<p>C'est exactement pour ça qu'existe la <strong>carte membre Label Vanlife</strong>. Un outil pensé par et pour les vanlifers, qui transforme chaque étape de road trip en expérience fluide, accueillie et avantageuse.</p>

<h2>C'est quoi exactement la carte membre Label Vanlife ?</h2>

<p><a href="https://labelvanlife.com/" target="_blank" rel="noopener noreferrer">Label Vanlife</a> est un réseau de lieux certifiés "van-friendly" en France : campings, aires naturelles, domaines — tous sélectionnés pour leur accueil des vanlifers. La carte membre, c'est ton passeport pour ce réseau.</p>

<p>Elle te donne accès à :</p>

<ul>
  <li>Des <strong>réductions de 10 à 20%</strong> sur le tarif nuit chez tous les lieux labellisés</li>
  <li>Une <strong>carte interactive</strong> des spots certifiés, mise à jour en temps réel</li>
  <li>Un outil de <strong>création de road trip</strong> avec les étapes labellisées sur ta route</li>
  <li>La garantie d'être attendu et bien accueilli — pas juste toléré</li>
  <li>L'accès en avant-première aux nouveaux lieux et événements vanlife</li>
</ul>

<h2>Comment fonctionne la réduction concrètement ?</h2>

<p>Chaque lieu labellisé affiche le type de réduction accordée aux membres. Exemple concret : une nuit à 22€ devient 17,60€ avec 20% de réduction. Sur un road trip de 10 nuits, tu économises entre 40 et 80€ — soit le prix de ta carte remboursé dès les premières étapes.</p>

<p>Le calcul est simple : <strong>une seule nuit avec réduction suffit à rentabiliser l'adhésion annuelle.</strong></p>

<blockquote>💡 <strong>Conseil :</strong> Plus tu voyages, plus la carte est rentable. Un vanlifer qui fait 3 road trips par an dans des zones avec des spots labellisés économise facilement 200 à 300€ sur l'année.</blockquote>

<h2>La carte interactive : trouve ton prochain spot en 30 secondes</h2>

<p>L'outil permet de visualiser tous les spots certifiés, de filtrer par services (douches, électricité, wifi, accepte les chiens), et de contacter directement chaque lieu. Plus besoin de croiser Park4Night, Google Maps et les avis Facebook.</p>

<h3>Crée ton road trip étape par étape</h3>

<p>Tu indiques ta région de voyage, et l'outil te propose les lieux labellisés sur ton chemin avec les distances et services disponibles. C'est la fin des nuits improvisées dans des parkings de supermarché parce que tu n'as pas trouvé mieux à 22h.</p>

<h2>Un exemple concret : Camping Le Val aux Fées, Brocéliande</h2>

<p>Parmi les premiers lieux labellisés : le <strong>Camping Le Val aux Fées à Concoret</strong> (Morbihan, 56), en forêt de Brocéliande — cadre exceptionnel, emplacements sous les arbres, accepte les chiens, wifi. Ce lieu accueille le <em>Brocéliande VW Camp's</em> (19-21 juin 2026).</p>

<p>Tous les lieux sur <a href="https://labelvanlife.com/lieux" target="_blank" rel="noopener noreferrer">labelvanlife.com/lieux</a>.</p>

<blockquote>📍 <strong>Expérience terrain :</strong> Le réseau Label Vanlife sélectionne des lieux qui ne cherchent pas juste à remplir des emplacements — ce sont des endroits où les vanlifers sont attendus, compris, et accueillis comme des voyageurs responsables.</blockquote>

<h2>Pour qui c'est fait ?</h2>

<p>La carte membre Label Vanlife s'adresse à :</p>

<ul>
  <li><strong>Les vanlifers à temps plein</strong> qui cherchent des spots fiables et bien accueillis</li>
  <li><strong>Les road trippers saisonniers</strong> qui veulent optimiser leurs nuits sans sacrifier la qualité</li>
  <li><strong>Les familles en van</strong> qui ont besoin de services (douches, électricité, acceptation des animaux)</li>
  <li><strong>Les propriétaires de vans en location</strong> (Yescapa, Wikicampers) qui veulent proposer des itinéraires clés en main à leurs locataires</li>
</ul>

<h2>FAQ — Carte membre Label Vanlife</h2>

<h3>La carte membre Label Vanlife est-elle disponible partout en France ?</h3>

<p>Le réseau est en cours de développement sur l'ensemble du territoire français. Les premières zones couvertes incluent la Bretagne, le Sud-Ouest et la région PACA. Le réseau s'agrandit en permanence — chaque nouveau lieu labellisé enrichit la carte disponible pour tous les membres.</p>

<h3>Combien coûte l'adhésion à Label Vanlife ?</h3>

<p>Le tarif d'adhésion est disponible directement sur <a href="https://labelvanlife.com/" target="_blank" rel="noopener noreferrer">labelvanlife.com</a>. L'adhésion est annuelle et se rentabilise dès la première nuit en lieu labellisé avec réduction. En phase de lancement, des tarifs préférentiels sont accessibles pour les premiers membres.</p>

<h3>Peut-on suggérer un lieu à labeliser ?</h3>

<p>Oui. Si tu as dormi dans un camping ou une aire naturelle qui mériterait d'être labellisée, tu peux le signaler via le formulaire sur <a href="https://labelvanlife.com/lieux" target="_blank" rel="noopener noreferrer">labelvanlife.com/lieux</a>. L'équipe Label Vanlife contacte ensuite le gestionnaire. Chaque membre peut devenir ambassadeur des bons spots.</p>

<h2>Conclusion</h2>

<p>La <strong>carte membre Label Vanlife</strong> répond à un besoin simple : voyager en van en sachant où dormir, être bien accueilli, et payer moins cher. Ce n'est pas juste un outil de réduction — c'est l'accès à un réseau de lieux sélectionnés pour leur engagement réel envers les vanlifers.</p>

<ul>
  <li>10 à 20% de réduction sur les nuits en lieux labellisés</li>
  <li>Carte interactive des spots certifiés van-friendly en France</li>
  <li>Adhésion remboursée dès la première nuit avec réduction</li>
</ul>

<p>Découvrir la carte membre et rejoindre le réseau : <a href="https://labelvanlife.com/" target="_blank" rel="noopener noreferrer">labelvanlife.com</a></p>

<p><em>Cet article est rédigé dans le cadre d'un partenariat éditorial entre Vanzon Explorer et Label Vanlife.</em></p>`,
  },
  {
    title: "La labellisation des lieux vanlife : c'est quoi concrètement, et comment ça marche ?",
    target_url: "https://labelvanlife.com/lieux",
    excerpt:
      "La labellisation Label Vanlife certifie les campings, aires naturelles et domaines qui accueillent vraiment les vanlifers — avec des critères précis sur les services, l'environnement et l'attitude. Guide complet du processus de candidature.",
    html_content: `<h1>La labellisation des lieux vanlife : c'est quoi concrètement, et comment ça marche ?</h1>

<p>En 2026, la vanlife française est confrontée à une réalité : de plus en plus de lieux se ferment, des arrêtés tombent, des campings affichent "sans camping-cars". Et en parallèle, une poignée d'endroits font exactement l'opposé — ils accueillent vraiment les vanlifers, ils aménagent des emplacements adaptés. Ces lieux méritent d'être connus. C'est là qu'intervient la <strong>labellisation Label Vanlife</strong>.</p>

<h2>C'est quoi le label Label Vanlife ?</h2>

<p>Une certification attribuée à des lieux qui répondent à des critères spécifiques d'accueil des vanlifers. Ce n'est pas un simple annuaire — c'est une <strong>charte de qualité et d'engagement</strong> : le lieu s'engage à bien accueillir les vanlifers, en échange d'une visibilité auprès de milliers de voyageurs.</p>

<p>Types de lieux labellisables :</p>
<ul>
  <li>Campings</li>
  <li>Aires naturelles</li>
  <li>Domaines privés</li>
  <li>Fermes et hébergements insolites avec stationnement van</li>
</ul>

<h2>Les critères de sélection</h2>

<p>Pour obtenir le label, un lieu doit répondre à plusieurs exigences non négociables :</p>

<ul>
  <li><strong>Accueil spécifique des vanlifers</strong> — emplacements dimensionnés, attitude bienveillante du gestionnaire</li>
  <li><strong>Services essentiels</strong> — eau potable, vidange eaux grises, sanitaires. Électricité en option.</li>
  <li><strong>Environnement de qualité</strong> — nature, calme, particularité locale (pas de parkings en béton)</li>
  <li><strong>Ouverture d'esprit</strong> — acceptation des chiens, convivialité, compréhension du mode de vie vanlifer</li>
</ul>

<blockquote>💡 <strong>Ce qui fait la différence :</strong> La labellisation ne récompense pas le luxe — elle récompense l'authenticité et l'accueil réel. Un camping rudimentaire mais chaleureux et bien placé peut obtenir le label plus facilement qu'une structure haut de gamme froide et peu adaptée.</blockquote>

<h2>Comment candidater ou suggérer un lieu ?</h2>

<h3>Pour les gestionnaires de lieux</h3>

<p>La candidature se fait directement via le formulaire sur <a href="https://labelvanlife.com/lieux" target="_blank" rel="noopener noreferrer">labelvanlife.com/lieux</a>. En phase de lancement du réseau, <strong>l'intégration est gratuite</strong>. L'équipe Label Vanlife analyse la candidature, organise une visite ou un échange, puis attribue ou non le label avec retour motivé.</p>

<h3>Pour les vanlifers</h3>

<p>Tu as dormi dans un camping incroyable pas encore labellisé ? Signale-le via le formulaire. L'équipe contacte le gestionnaire. Chaque membre devient ambassadeur des bons spots — c'est ainsi que le réseau grandit de façon organique, par les expériences réelles des voyageurs.</p>

<h2>Une opportunité concrète pour les lieux</h2>

<p>Les vanlifers sont une clientèle fidèle, peu exigeante sur le luxe, très sensible à l'authenticité. Un lieu labellisé bénéficie de :</p>

<ul>
  <li>Une <strong>visibilité sur la communauté vanlife française</strong> — plusieurs milliers de membres actifs</li>
  <li>Une <strong>fiche détaillée avec photos</strong> sur la plateforme Label Vanlife</li>
  <li>Un <strong>positionnement sur la carte interactive</strong> consultée à chaque road trip</li>
  <li>Un flux régulier de voyageurs qualifiés, respectueux des lieux et des règles</li>
</ul>

<blockquote>📍 <strong>Exemple :</strong> Le Camping Le Val aux Fées à Concoret (Brocéliande, Morbihan) est l'un des premiers lieux labellisés. Cadre exceptionnel en forêt, emplacements sous les arbres, accepte les chiens. Ce lieu accueille le Brocéliande VW Camp's du 19 au 21 juin 2026.</blockquote>

<h2>Pourquoi la labellisation protège aussi les vanlifers</h2>

<p>Un lieu labellisé, c'est un lieu qui a accepté une charte. Pour le vanlifer, c'est la garantie de ne pas se retrouver dans un endroit qui "tolère" les van aménagés mais n'est pas du tout adapté. C'est la fin des malentendus à l'arrivée — le gestionnaire sait qui il accueille, le vanlifer sait ce qu'il va trouver.</p>

<p>Cette réciprocité d'engagement est le fondement du réseau : <strong>des lieux qui s'engagent à bien accueillir, des membres qui s'engagent à respecter les lieux.</strong></p>

<h2>FAQ — Labellisation Label Vanlife</h2>

<h3>Le label est-il payant pour les gestionnaires de lieux ?</h3>

<p>En phase de lancement du réseau, l'intégration est gratuite pour les gestionnaires. Le modèle économique de Label Vanlife repose sur les adhésions membres, pas sur les lieux. L'objectif est de développer un réseau dense avant d'envisager un modèle freemium pour les lieux premium.</p>

<h3>Combien de temps prend le processus de labellisation ?</h3>

<p>Le délai entre la candidature et la décision varie selon les périodes et le volume de demandes. L'équipe s'engage à répondre à chaque candidature avec un retour motivé. Le processus inclut généralement un échange avec le gestionnaire et parfois une visite ou un questionnaire détaillé.</p>

<h3>Le label peut-il être retiré ?</h3>

<p>Oui. Le label est conditionnel au maintien des critères d'accueil. Des retours négatifs répétés de la part des membres sur un lieu labellisé peuvent déclencher une réévaluation. C'est ce qui garantit la qualité du réseau dans la durée.</p>

<h2>Conclusion</h2>

<p>La <strong>labellisation Label Vanlife</strong> n'est pas un annuaire de campings de plus — c'est un système de confiance mutuelle entre des lieux qui s'engagent à bien accueillir et des voyageurs qui respectent ce qu'ils trouvent. Dans un contexte où les spots se ferment et où les communes durcissent les règles de stationnement itinérant, ce type de réseau est une réponse concrète et constructive.</p>

<ul>
  <li>Des critères de sélection exigeants sur l'accueil, les services et l'environnement</li>
  <li>Une candidature gratuite en phase de lancement pour les gestionnaires</li>
  <li>Chaque membre vanlifer peut suggérer un lieu à labelliser</li>
</ul>

<p>Voir les lieux labellisés et candidater : <a href="https://labelvanlife.com/lieux" target="_blank" rel="noopener noreferrer">labelvanlife.com/lieux</a></p>

<p><em>Cet article est rédigé dans le cadre d'un partenariat éditorial entre Vanzon Explorer et Label Vanlife.</em></p>`,
  },
  {
    title: "Pourquoi la vanlife a besoin d'un label aujourd'hui — et la vision derrière Label Vanlife",
    target_url: "https://labelvanlife.com/blog/pourquoi-la-vanlife-a-besoin-dun-label-en-2026",
    excerpt:
      "La vanlife est à un tournant : spots qui se ferment, mairies qui interdisent, campings qui refusent les vans. Label Vanlife propose une réponse structurée — un réseau de confiance entre lieux engagés et vanlifers responsables pour préserver la liberté d'aller.",
    html_content: `<h1>Pourquoi la vanlife a besoin d'un label aujourd'hui</h1>

<p>Il y a dix ans, la vanlife était un acte marginal, presque underground. Aujourd'hui c'est un phénomène de masse. Et à mesure qu'elle s'est démocratisée, quelque chose s'est cassé. Les spots se ferment. Les campings se méfient. Les mairies interdisent. Les vrais vanlifers — ceux qui voyagent depuis des années dans le respect des lieux — se retrouvent pénalisés par les comportements de quelques-uns. C'est dans ce contexte qu'est né <a href="https://labelvanlife.com/blog/pourquoi-la-vanlife-a-besoin-dun-label-en-2026" target="_blank" rel="noopener noreferrer">Label Vanlife</a>.</p>

<h2>La vanlife sans structure détruit ce qu'elle aime</h2>

<p>Un spot magnifique partagé sur TikTok. Deux semaines plus tard, 300 vans le week-end. Un mois après, arrêté municipal. Spot fermé.</p>

<p>Ce scénario se répète partout en France. Sans code de conduite partagé, sans interlocuteur face aux communes, la vanlife grignote ses propres espaces.</p>

<ul>
  <li>Des communes qui interdisent le stationnement des vans</li>
  <li>Des campings qui refusent les vans aménagés par peur des nuisances</li>
  <li>Des propriétaires qui bloquent leurs accès après de mauvaises expériences</li>
  <li>Des vanlifers responsables qui subissent la réputation construite par d'autres</li>
</ul>

<p><strong>La vanlife a besoin d'une structure. Pas pour perdre sa liberté — mais pour la préserver.</strong></p>

<blockquote>⚠️ <strong>Le paradoxe de la popularité :</strong> Plus la vanlife attire de monde, plus les spots se ferment. La croissance non régulée du mouvement est le principal facteur de sa propre destruction.</blockquote>

<h2>La réponse : un label qui crée de la confiance</h2>

<p>Label Vanlife crée un <strong>système de confiance mutuelle</strong> entre lieux d'accueil et voyageurs itinérants.</p>

<ul>
  <li>Des lieux s'engagent à bien accueillir les vanlifers → ils obtiennent une visibilité qualifiée</li>
  <li>Des membres s'engagent à respecter une charte → ils obtiennent un accès à des spots certifiés avec réductions</li>
</ul>

<p>Le cercle vertueux : plus de lieux = plus d'avantages membres. Plus de membres = plus de lieux qui rejoignent. Un réseau solide pèse face aux communes qui régulent le stationnement itinérant.</p>

<h2>La vision : devenir l'interlocuteur officiel de la vanlife en France</h2>

<h3>Peser dans les décisions locales</h3>

<p>Quand une mairie veut interdire les vans, Label Vanlife doit être à la table des négociations — avec des données, des engagements, des membres identifiables. Ce n'est pas une utopie : c'est exactement ce que des associations de camping-caristes ont réussi à faire dans plusieurs régions depuis les années 2000. La vanlife mérite le même type de représentation.</p>

<h3>Un réseau national de lieux certifiés</h3>

<p>L'objectif à moyen terme : couvrir l'ensemble du territoire français avec des lieux labellisés répartis sur les principaux axes de road trip — côte atlantique, Alpes, Pyrénées, Bretagne, Provence. Un réseau suffisamment dense pour qu'un vanlifer puisse traverser la France sans jamais s'interroger sur où dormir.</p>

<h3>Une charte comportementale reconnue</h3>

<p>Au-delà des lieux, Label Vanlife travaille sur une charte membre — un engagement comportemental que chaque adhérent accepte : respect des règles de chaque lieu, gestion des déchets, discrétion dans les zones habitées. Cette charte devient un argument face aux communes : "Nos membres sont identifiés et engagés".</p>

<blockquote>📍 <strong>Perspective terrain :</strong> Le modèle existe déjà dans d'autres pays européens. En Allemagne, le réseau des "Stellplätze" certifiés pour camping-cars fonctionne avec des milliers de lieux et des millions d'utilisateurs. La France a le potentiel de développer un équivalent spécifiquement pensé pour la culture vanlife — plus souple, plus authentique, moins institutionnel.</blockquote>

<h2>Ce que ça change pour les vanlifers aujourd'hui</h2>

<p>Rejoindre Label Vanlife maintenant, en phase de lancement, c'est participer à la construction du réseau. C'est aussi bénéficier des meilleures conditions d'adhésion avant que le réseau ne grossisse et que les tarifs évoluent.</p>

<p>Mais au-delà des avantages immédiats, c'est un signal : <strong>je fais partie des voyageurs qui veulent que la vanlife reste possible dans dix ans.</strong></p>

<h2>FAQ — Label Vanlife et l'avenir de la vanlife en France</h2>

<h3>Label Vanlife est-il une association ou une entreprise ?</h3>

<p>Label Vanlife est une structure privée avec une mission d'intérêt général pour la communauté vanlife. L'objectif n'est pas de devenir une fédération officielle mais de créer un réseau opérationnel, agile, capable de répondre aux besoins des vanlifers et des lieux d'accueil sans la lourdeur d'une structure associative classique.</p>

<h3>Comment Label Vanlife compte-t-il peser face aux décisions municipales ?</h3>

<p>Par la représentation numérique d'abord : un réseau de milliers de membres identifiés est un argument face à un maire. Par la documentation ensuite : des données sur les comportements des membres, les nuits effectuées, l'impact économique local des vanlifers. Et par le dialogue enfin : proposer des solutions (lieux certifiés, charte comportementale) plutôt que de subir les interdictions.</p>

<h3>La vanlife peut-elle vraiment être "organisée" sans perdre son âme ?</h3>

<p>C'est la vraie question. Et la réponse de Label Vanlife est pragmatique : sans organisation minimale, la vanlife libre disparaît sous les arrêtés et les interdictions. Avec une organisation légère et bienveillante, elle peut coexister avec les territoires qu'elle traverse. Ce n'est pas une question d'idéologie — c'est une question de survie du mode de vie.</p>

<h2>Conclusion</h2>

<p>La vanlife est à un tournant. La croissance sans structure menace les espaces qui la rendent possible. <strong>Label Vanlife</strong> propose une réponse concrète : un réseau de confiance mutuelle, une charte commune, et la construction d'un interlocuteur crédible face aux communes et aux propriétaires.</p>

<ul>
  <li>Des spots se ferment partout en France — la vanlife non organisée détruit ses propres espaces</li>
  <li>Label Vanlife crée un cercle vertueux entre lieux engagés et membres responsables</li>
  <li>Rejoindre maintenant, c'est participer à la construction du réseau dès le départ</li>
</ul>

<p>En savoir plus et rejoindre : <a href="https://labelvanlife.com/blog/pourquoi-la-vanlife-a-besoin-dun-label-en-2026" target="_blank" rel="noopener noreferrer">labelvanlife.com</a></p>

<p><em>Cet article est rédigé dans le cadre d'un partenariat éditorial entre Vanzon Explorer et Label Vanlife.</em></p>`,
  },
];

async function main() {
  for (const article of articles) {
    const { data, error } = await supabase
      .from("draft_articles")
      .insert(article)
      .select("id, title")
      .single();

    if (error) {
      console.error("❌", error.message);
      process.exit(1);
    }
    console.log("✅ Inséré :", data.id);
    console.log("   Titre :", data.title);
  }
}

main().catch(console.error);
