#!/usr/bin/env tsx
/**
 * send-backlink-articles.ts
 *
 * Envoie les 3 articles de backlink SEO par email à jules@vanzonexplorer.com
 * Format HTML propre, prêt à être copié-collé sur des sites externes.
 *
 * Usage:
 *   npx tsx scripts/send-backlink-articles.ts
 */

import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// ── Gmail API (src/lib/gmail.ts) ──────────────────────────────────────────────
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

async function getGmailAccessToken(): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_GSC_CLIENT_ID!,
      client_secret: process.env.GOOGLE_GSC_CLIENT_SECRET!,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN!,
      grant_type:    "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`[gmail] token exchange failed: ${await res.text()}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

async function sendGmailEmail(to: string, subject: string, htmlBody: string): Promise<string> {
  const subjectEncoded = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const mime = [
    `From: Jules - Vanzon Explorer <jules@vanzonexplorer.com>`,
    `To: ${to}`,
    `Subject: ${subjectEncoded}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    htmlBody,
  ].join("\r\n");

  const raw = Buffer.from(mime).toString("base64url");
  const token = await getGmailAccessToken();
  const res = await fetch(`${GMAIL_API}/users/me/messages/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) throw new Error(`[gmail] send failed: ${await res.text()}`);
  const data = await res.json() as { id: string };
  return data.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLE 1 — Van Business Academy
// ─────────────────────────────────────────────────────────────────────────────
const article1 = `
<h1>Van Business Academy : comment transformer un van aménagé en actif qui rapporte (chiffres réels)</h1>

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

<p>Pas de projection optimiste : voici les ordres de grandeur constatés sur les projets accompagnés par Vanzon Explorer, depuis leur base à Cambo-les-Bains (64) :</p>

<ul>
  <li>Revenus locatifs nets annuels : <strong>5 000 à 9 000€</strong></li>
  <li>Plus-value à la revente (van aménagé + VASP) : <strong>6 000 à 9 000€</strong> par rapport au prix d'achat + aménagement</li>
  <li>Durée avant première location : <strong>3 mois</strong> avec la méthode</li>
  <li>Budget aménagement : <strong>5 000€ maximum</strong></li>
</ul>

<p>Ces chiffres ne promettent rien. Ils reflètent ce qui est atteignable lorsque les décisions en amont — achat, matériaux, homologation — ont été bien prises.</p>

<h2>L'homologation VASP, le levier méconnu</h2>

<p>Le VASP est la mention qui change tout sur la carte grise d'un véhicule aménagé. Elle certifie que le van a été transformé selon des normes précises et qu'il peut légalement être utilisé comme véhicule de loisir aménagé. Son impact financier est direct :</p>

<table>
  <thead>
    <tr>
      <th>Situation</th>
      <th>Prix de revente estimé</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Van aménagé <strong>avec</strong> homologation VASP</td>
      <td>25 000 à 30 000€</td>
    </tr>
    <tr>
      <td>Van aménagé <strong>sans</strong> homologation VASP</td>
      <td>20 000 à 25 000€</td>
    </tr>
    <tr>
      <td><strong>Écart</strong></td>
      <td><strong>+5 000€ minimum</strong></td>
    </tr>
  </tbody>
</table>

<p>5 000€ de plus-value pour une démarche administrative que la plupart évitent par méconnaissance. C'est un des axes centraux de la <a href="https://vanzonexplorer.com/formation">formation Van Business Academy</a> : accompagner chaque porteur de projet jusqu'à l'obtention de cette homologation, pour que rien ne soit laissé sur la table.</p>

<h2>Pour qui c'est fait — et pour qui ça ne l'est pas</h2>

<p>La Van Business Academy n'est pas un programme pour "devenir riche avec un van". Jules Gaveglio, fondateur de Vanzon Explorer, est clair là-dessus : c'est un projet qui demande un investissement initial, du temps, et une vraie rigueur d'exécution.</p>

<p>Le profil qui correspond :</p>

<ul>
  <li>Quelqu'un qui veut créer un actif locatif tangible, pas une activité principale</li>
  <li>Une personne prête à suivre une méthode structurée plutôt qu'à improviser</li>
  <li>Quelqu'un qui comprend que la rentabilité se construit sur 12 à 24 mois, pas en 3 semaines</li>
  <li>Un profil qui veut comprendre ce qu'il fait, pas juste exécuter des instructions</li>
</ul>

<p>La différence entre un projet qui aboutit et un van qui prend la poussière dans un parking n'est pas une question de chance. C'est une question de séquençage : acheter le bon véhicule, l'aménager avec les bons matériaux, obtenir le VASP, et déployer une stratégie de location cohérente.</p>

<p>Chacune de ces étapes est documentée, outillée et accompagnée dans le cadre de la <a href="https://vanzonexplorer.com/formation">Van Business Academy de Vanzon Explorer</a>. Pas pour promettre un résultat garanti — mais pour éliminer les erreurs évitables qui font échouer la majorité des projets avant même qu'ils commencent.</p>
`;

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLE 2 — Road Trip Personnalisé
// ─────────────────────────────────────────────────────────────────────────────
const article2 = `
<h1>Comment planifier un itinéraire van personnalisé en France (et arrêter de copier les mêmes "top 10")</h1>

<p>Soyons honnêtes : la plupart des guides de road trip se ressemblent. Même liste de spots Instagram. Mêmes étapes "incontournables". Mêmes parkings bondés en juillet. Si vous avez déjà passé une soirée à compiler des listes Pinterest pour finalement repartir avec un itinéraire qui ne vous ressemble pas vraiment, vous savez exactement de quoi on parle.</p>

<p>Un road trip en van, c'est justement l'inverse de ça. C'est partir avec vos propres priorités, votre rythme, vos envies profondes — que vous soyez en quête de spots de surf sauvages, de villages médiévaux en Dordogne ou de cols alpins sans une âme à l'horizon. Le problème, c'est que <strong>planifier un itinéraire vraiment sur-mesure prend du temps</strong>. À moins d'avoir les bons outils.</p>

<h2>Pourquoi le road trip sur-mesure change tout</h2>

<p>Un couple d'aventuriers qui veut dormir en altitude chaque nuit et un père de famille cherchant des campings avec piscine et terrain de jeux n'ont absolument pas le même voyage idéal — et pourtant, les deux pourraient se retrouver à parcourir les mêmes guides génériques.</p>

<p>La personnalisation d'un itinéraire van, c'est d'abord une question de <strong>profil voyageur</strong> :</p>

<ul>
  <li>Votre appétit pour l'aventure vs le confort</li>
  <li>Le nombre de jours disponibles (4 jours ou 3 semaines, ça ne se planifie pas pareil)</li>
  <li>Vos centres d'intérêt : gastronomie locale, randonnée, patrimoine, plages, vie sauvage</li>
  <li>Votre région de départ et les contraintes de distance</li>
</ul>

<p>Un itinéraire qui tient compte de tous ces paramètres, c'est la différence entre un voyage qu'on subit et un voyage qu'on raconte encore dix ans après.</p>

<h2>Comment fonctionne le générateur d'itinéraires Vanzon Explorer</h2>

<p>L'équipe de Vanzon Explorer — basée à Cambo-les-Bains au cœur du Pays Basque — a développé un outil gratuit qui s'attaque justement à ce problème. <a href="https://vanzonexplorer.com/road-trip-personnalise">Le générateur de road trip personnalisé</a> fonctionne comme un assistant de voyage : il vous pose les bonnes questions, puis construit un itinéraire cohérent à partir de vos réponses.</p>

<p>Le processus se déroule en quelques étapes simples :</p>

<ul>
  <li><strong>La région :</strong> Bretagne, Alpes, Pyrénées, Provence, Côte Atlantique — vous choisissez votre terrain de jeu</li>
  <li><strong>La durée :</strong> de quelques jours à plusieurs semaines, le générateur adapte le rythme et le nombre d'étapes</li>
  <li><strong>Vos intérêts :</strong> randonnée, surf, gastronomie, patrimoine, nature sauvage, villages authentiques</li>
  <li><strong>Votre profil voyageur :</strong> solo, en couple, en famille, nomade confirmé ou premier van trip</li>
</ul>

<p>À partir de ces données, l'outil génère un itinéraire complet avec des étapes concrètes, des spots recommandés et une logique de parcours qui fait sens géographiquement. C'est gratuit, immédiat, et l'un des rares outils de ce type disponibles en France pour les van-lifers.</p>

<h2>Trois exemples d'itinéraires selon votre profil</h2>

<p><strong>Le couple aventurier (10 jours, Pyrénées)</strong><br>
Départ de Pau, montée vers le Cirque de Gavarnie, bivouac au lac de Caillauas, descente vers la Cerdagne et les Orgues d'Ille-sur-Têt, retour par le Conflent. Peu de campings, beaucoup d'altitude, des routes à flanc de montagne.</p>

<p><strong>La famille avec jeunes enfants (7 jours, Bretagne)</strong><br>
Base arrière à Carnac, excursion en kayak de mer dans le Golfe du Morbihan, étape à la presqu'île de Crozon, baignade à Morgat. Priorité : étapes courtes, plages sécurisées, services à proximité.</p>

<p><strong>Le solo nomade (3 semaines, France intérieure)</strong><br>
Évite les côtes en été, remonte par le Massif Central, bivouac dans les gorges du Tarn, traversée de l'Aubrac, fin de parcours dans le Cantal. Rythme lent, destinations hors radar touristique, liberté totale.</p>

<h2>Les critères essentiels pour choisir ses spots van</h2>

<p>Un bon itinéraire, c'est aussi une suite de spots qui tiennent leurs promesses sur le terrain. Avant de valider une étape, quelques critères à garder en tête :</p>

<ul>
  <li><strong>Le bivouac :</strong> autorisé ou toléré ? Vérifiez les arrêtés locaux</li>
  <li><strong>Les services :</strong> eau potable, vidange, électricité — planifier les étapes "techniques" à l'avance évite les mauvaises surprises</li>
  <li><strong>L'accessibilité :</strong> certains spots spectaculaires sont sur des pistes impossibles pour un van de 6 mètres</li>
  <li><strong>La saisonnalité :</strong> un spot idéal en mai peut être infernal en août</li>
  <li><strong>Les points d'intérêt à proximité :</strong> un bon spot de nuit, c'est aussi une base pour explorer à pied, à vélo ou en kayak le lendemain matin</li>
</ul>

<h2>S'inspirer avec le catalogue d'itinéraires avant de personnaliser</h2>

<p>Vous n'avez pas encore d'idée de région ? Avant de lancer le générateur, il peut être utile de feuilleter <a href="https://vanzonexplorer.com/road-trip">le catalogue d'itinéraires van de Vanzon Explorer</a> pour s'inspirer. Le catalogue regroupe des parcours concrets par région — Pays Basque, Bretagne, Provence, Alpes, Normandie — avec des guides pratiques qui donnent une idée réaliste de ce que vaut chaque terrain de jeu selon la saison et le profil.</p>

<p>L'approche de l'équipe Vanzon tient en une phrase : partir d'exemples réels pour construire quelque chose d'unique. Pas le contraire.</p>

<h2>Finissez par la bonne question</h2>

<p>Avant de chercher "road trip van France" sur Google, posez-vous la vraie question : <strong>qu'est-ce que vous voulez vivre, concrètement, pendant ce voyage ?</strong> Une semaine de bivouacs sauvages en altitude ? Dix jours de plages bretonnes avec les enfants ? Un mois à traverser la France par les routes que personne ne prend ?</p>

<p>Une fois que vous avez la réponse, deux ressources pratiques :</p>

<ul>
  <li><a href="https://vanzonexplorer.com/road-trip-personnalise">Générer votre itinéraire van personnalisé</a> — gratuit, immédiat, calibré sur vos critères</li>
  <li><a href="https://vanzonexplorer.com/road-trip">Explorer le catalogue d'itinéraires van en France</a> — pour s'inspirer et affiner votre destination</li>
</ul>

<p>Le meilleur road trip, c'est celui que vous n'avez pas encore fait. Et il commence par refuser les itinéraires qui ne vous ressemblent pas.</p>
`;

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLE 3 — Location van Pays Basque
// ─────────────────────────────────────────────────────────────────────────────
const article3 = `
<h1>Location de van aménagé au Pays Basque : le guide complet pour un road trip inoubliable</h1>

<p>Oubliez la chambre d'hôtel vue sur parking et le camping où les tentes se touchent à 30 centimètres. Le Pays Basque mérite mieux que ça. Ici, la liberté a une autre saveur : celle du réveil face à l'Atlantique, du café chaud avalé sur le marche-pied avant d'attraper une vague à Biarritz, ou de la nuit bercée par le vent de la montagne après une journée dans la forêt d'Irati. La <strong>location de van aménagé au Pays Basque</strong> n'est pas juste un mode de transport — c'est une façon de vivre le territoire autrement, à votre rythme, sans contrainte.</p>

<h2>Pourquoi le Pays Basque est parfait pour un road trip en van</h2>

<p>Peu de régions en France offrent une telle densité d'expériences sur un aussi petit territoire. En partant de Cambo-les-Bains — cœur du Pays Basque intérieur — vous êtes à <strong>20 minutes de Biarritz et de Bayonne</strong>, à 30 minutes de Saint-Jean-de-Luz et ses ruelles colorées, à 45 minutes des vagues mythiques d'Hossegor, et à une heure à peine des hauteurs sauvages de la forêt d'Irati.</p>

<p>Cette géographie extraordinaire, c'est précisément ce qui rend le van si pertinent ici. Pas besoin de choisir entre la montagne et l'océan : vous dormez au bord des Pyrénées le lundi, vous surfez le mardi, vous dégustez des pintxos à Bayonne le mercredi. Ajoutez à cela une culture basque vibrante — les Fêtes de Bayonne, les <em>pottoks</em> (ces poneys sauvages qui paissent librement sur les crêtes), la langue euskara affichée sur chaque panneau — et vous comprenez pourquoi le Pays Basque est l'une des destinations de road trip les plus envoûtantes d'Europe.</p>

<h2>Yoni et Xalbat : les vans Vanzon Explorer</h2>

<p>Derrière <a href="https://vanzonexplorer.com/location">Vanzon Explorer</a> se trouve Jules Gaveglio, fondateur qui ne fait pas semblant de connaître le territoire : il a grandi au Pays Basque depuis l'âge de 4 ans. La flotte est à son image — petite, soignée, authentique.</p>

<p><strong>Yoni</strong>, le van vert, est le premier né de l'aventure. C'est lui qui a ouvert la route, le van des premières fois. Jules y a lui-même dormi pendant les Fêtes de Bayonne — une expérience qu'il recommande à quiconque veut vivre cet événement à fond, sans stress de logement ni de retour.</p>

<p><strong>Xalbat</strong>, le van blanc, est arrivé ensuite. Son nom ? Celui du chat de Jules. Un prénom basque — prononcé <em>"Chalbat"</em> — qui résume bien l'état d'esprit de Vanzon : ancré dans la culture locale, avec une touche d'humour et d'humanité. Les deux vans sont entièrement aménagés pour le voyage en autonomie : literie confortable, équipements de cuisine, prises pour recharger vos appareils. Tout le nécessaire, sans le superflu.</p>

<p>Chaque van est équipé de sacs poubelles — Vanzon sensibilise activement ses voyageurs au respect des espaces naturels, notamment dans des sites comme la forêt d'Irati, trop souvent touchés par les déchets laissés par les visiteurs.</p>

<h2>Les spots incontournables depuis Cambo-les-Bains</h2>

<ul>
  <li><strong>Biarritz (20 min)</strong> — Surf, rochers, Grande Plage, et une architecture belle époque qui détonne. Garez votre van tôt le matin pour les meilleurs spots de stationnement.</li>
  <li><strong>Bayonne (20 min)</strong> — Remparts, chocolat basque, marché du vendredi. Une nuit entière, surtout en juillet pendant les Fêtes de Bayonne — l'un des plus grands rassemblements festifs de France.</li>
  <li><strong>Saint-Jean-de-Luz (30 min)</strong> — Port de pêche, maisons à colombages rouges, thon basque au restaurant. Une escale incontournable.</li>
  <li><strong>Hossegor (45 min)</strong> — Pour les amateurs de surf et d'architecture landaise. Les vagues de la Gravière sont parmi les meilleures d'Europe.</li>
  <li><strong>La forêt d'Irati (1h)</strong> — L'une des plus grandes hêtraies-sapinières d'Europe. Magique, surtout en automne. <strong>Emportez vos déchets</strong> — le site souffre du manque de civisme de certains visiteurs.</li>
  <li><strong>L'Ursuya</strong> — La petite montagne visible depuis Cambo. Parfaite pour une randonnée matinale. Les chemins d'altitude sont étroits : garez le van en bas et poursuivez à pied. Et gardez l'œil ouvert pour apercevoir les <strong>pottoks</strong>, ces poneys basques semi-sauvages qui symbolisent la liberté du territoire.</li>
</ul>

<h2>Conseils pratiques pour louer un van au Pays Basque</h2>

<ul>
  <li><strong>Réservez tôt en haute saison</strong> — de mi-avril à mi-septembre, la demande est forte. Les vans partent plusieurs semaines à l'avance pour les périodes de vacances scolaires.</li>
  <li><strong>Septembre-octobre pour les montagnes</strong> — période magnifique pour Irati et les Pyrénées, sans la foule estivale.</li>
  <li><strong>Bivouac responsable</strong> — Le bivouac est toléré dans de nombreux endroits, mais respectez les règles locales. Ne laissez aucune trace.</li>
  <li><strong>Emportez du cash</strong> — Certains marchés, parkings et producteurs locaux ne prennent pas la carte.</li>
  <li><strong>Préparez-vous à la météo atlantique</strong> — Ayez toujours une veste imperméable à portée. Une journée de pluie au Pays Basque peut être tout aussi belle dans les villages de l'intérieur.</li>
</ul>

<p>Les vans Vanzon sont loués via la plateforme Yescapa, ce qui garantit une couverture assurance complète pendant toute la durée de votre location.</p>

<h2>Tarifs et comment réserver</h2>

<p>Vanzon Explorer propose des <strong>tarifs adaptés à la saisonnalité</strong> du Pays Basque :</p>

<ul>
  <li><strong>Basse saison :</strong> 65 € / jour</li>
  <li><strong>Moyenne saison :</strong> 75 € / jour</li>
  <li><strong>Haute saison</strong> (15 avril → 15 septembre) : <strong>95 € / jour</strong></li>
</ul>

<p>Pour un week-end de trois jours hors saison, cela revient à moins de 200 € — soit souvent moins qu'une chambre d'hôtel correct sur la côte basque en été, pour une liberté incomparablement plus grande.</p>

<p>La réservation se fait directement en ligne. Consultez les disponibilités et choisissez entre Yoni et Xalbat sur <a href="https://vanzonexplorer.com/location"><strong>vanzonexplorer.com/location</strong></a>.</p>

<h2>Et si votre prochain séjour au Pays Basque se vivait sur la route ?</h2>

<p>Le Pays Basque est une région qui se mérite. Elle se révèle à ceux qui prennent le temps de s'y perdre, de prendre des chemins de traverse, de s'arrêter là où l'envie les mène. Un van aménagé, c'est précisément cet outil-là : pas un moyen de transport, mais un mode de vie temporaire.</p>

<p>Jules a grandi dans ce territoire. Il l'a parcouru, vécu, aimé avant de le partager. Yoni et Xalbat portent cette histoire — et ils n'attendent que de vous emmener à votre tour découvrir les crêtes de l'Ursuya, les vagues de Biarritz ou les hêtres centenaires d'Irati.</p>

<p>Prêt à partir ? Découvrez les disponibilités et réservez votre van sur <a href="https://vanzonexplorer.com/location"><strong>vanzonexplorer.com/location</strong></a>.</p>
`;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers HTML email
// ─────────────────────────────────────────────────────────────────────────────

function articleCard(
  num: number,
  label: string,
  accentColor: string,
  linkUrl: string,
  linkLabel: string,
  body: string
): string {
  return `
  <div style="background:#1a1a1a;border-radius:12px;margin-bottom:48px;overflow:hidden;border:1px solid #2a2a2a;">
    <!-- Header carte -->
    <div style="background:${accentColor};padding:20px 28px;display:flex;align-items:center;gap:12px;">
      <span style="background:rgba(0,0,0,0.25);color:#fff;font-family:'Inter',sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:4px 10px;border-radius:20px;">ARTICLE ${num}</span>
      <span style="color:#fff;font-family:'Inter',sans-serif;font-size:13px;opacity:0.9;">${label}</span>
    </div>

    <!-- Lien backlink -->
    <div style="padding:14px 28px;background:#111;border-bottom:1px solid #2a2a2a;">
      <span style="font-family:'Inter',sans-serif;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Backlink cible → </span>
      <a href="${linkUrl}" style="font-family:'Inter',sans-serif;font-size:12px;color:#60a5fa;text-decoration:none;">${linkUrl}</a>
    </div>

    <!-- Corps article -->
    <div style="padding:28px 32px;font-family:'Inter',sans-serif;font-size:15px;line-height:1.75;color:#d4d4d4;">
      ${body
        .replace(/<h1>/g, '<h1 style="font-size:22px;font-weight:800;color:#fff;margin:0 0 20px;line-height:1.3;">')
        .replace(/<h2>/g, '<h2 style="font-size:17px;font-weight:700;color:#fff;margin:28px 0 12px;padding-top:8px;border-top:1px solid #2a2a2a;">')
        .replace(/<p>/g, '<p style="margin:0 0 16px;">')
        .replace(/<ul>/g, '<ul style="margin:0 0 16px;padding-left:20px;">')
        .replace(/<ol>/g, '<ol style="margin:0 0 16px;padding-left:20px;">')
        .replace(/<li>/g, '<li style="margin-bottom:8px;">')
        .replace(/<strong>/g, '<strong style="color:#fff;font-weight:600;">')
        .replace(/<a href="https:\/\/vanzonexplorer\.com([^"]*)"([^>]*)>/g, `<a href="https://vanzonexplorer.com$1" style="color:${accentColor === '#B9945F' ? '#d4a574' : accentColor === '#22c55e' ? '#4ade80' : '#60a5fa'};font-weight:600;text-decoration:underline;"`)
        .replace(/<table>/g, '<table style="width:100%;border-collapse:collapse;margin:20px 0;">')
        .replace(/<thead>/g, '<thead>')
        .replace(/<th>/g, '<th style="background:#2a2a2a;color:#fff;padding:10px 14px;text-align:left;font-size:13px;font-weight:600;">')
        .replace(/<td>/g, '<td style="padding:10px 14px;border-bottom:1px solid #2a2a2a;font-size:14px;">')
      }
    </div>

    <!-- Footer carte -->
    <div style="padding:16px 28px;background:#111;border-top:1px solid #2a2a2a;display:flex;justify-content:space-between;align-items:center;">
      <a href="${linkUrl}" style="display:inline-block;background:${accentColor};color:#fff;font-family:'Inter',sans-serif;font-size:13px;font-weight:700;text-decoration:none;padding:10px 20px;border-radius:8px;">${linkLabel} →</a>
      <span style="font-family:'Inter',sans-serif;font-size:11px;color:#555;">Prêt à copier-coller sur site externe</span>
    </div>
  </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// Construction email HTML complet
// ─────────────────────────────────────────────────────────────────────────────

function buildEmailHtml(): string {
  const date = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>3 Articles Backlink SEO — Vanzon Explorer</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Inter',Arial,sans-serif;">

  <!-- Wrapper -->
  <div style="max-width:760px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0f0f0f 0%,#1a1a1a 100%);border:1px solid #2a2a2a;border-radius:16px;padding:36px 40px;margin-bottom:32px;text-align:center;">
      <div style="display:inline-block;background:linear-gradient(135deg,#B9945F,#E4D398);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">VANZON EXPLORER · SEO BACKLINKS</div>
      <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;">3 Articles de Backlink SEO</h1>
      <p style="margin:0 0 20px;color:#888;font-size:14px;">Générés le ${date} — Prêts à publier sur sites externes</p>
      <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;">
        <span style="background:#1a1a2e;border:1px solid #B9945F;color:#E4D398;font-size:11px;font-weight:600;padding:5px 12px;border-radius:20px;">Formation VBA</span>
        <span style="background:#0f1f0f;border:1px solid #22c55e;color:#4ade80;font-size:11px;font-weight:600;padding:5px 12px;border-radius:20px;">Road Trip</span>
        <span style="background:#0f1628;border:1px solid #3b82f6;color:#60a5fa;font-size:11px;font-weight:600;padding:5px 12px;border-radius:20px;">Location Pays Basque</span>
      </div>
    </div>

    <!-- Intro -->
    <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px 28px;margin-bottom:32px;">
      <p style="margin:0;font-size:13px;color:#aaa;line-height:1.6;">
        <strong style="color:#fff;">Mode d'emploi</strong> — Ces 3 articles sont rédigés pour être publiés sur des sites tiers (blogs, médias spécialisés vanlife, business, voyage) afin de générer des backlinks vers Vanzon Explorer. Chaque article intègre des liens contextuels naturels. Les titres H1 sont optimisés SEO. Le contenu est original et non-dupliqué.
      </p>
    </div>

    <!-- Article 1 — VBA -->
    ${articleCard(
      1,
      "Van Business Academy — Formation",
      "linear-gradient(135deg,#B9945F,#E4D398)",
      "https://vanzonexplorer.com/formation",
      "Voir la formation",
      article1
    )}

    <!-- Article 2 — Road Trip -->
    ${articleCard(
      2,
      "Road Trip Personnalisé + Catalogue",
      "#16a34a",
      "https://vanzonexplorer.com/road-trip-personnalise",
      "Voir l'outil",
      article2
    )}

    <!-- Article 3 — Location Pays Basque -->
    ${articleCard(
      3,
      "Location Van Pays Basque",
      "#2563eb",
      "https://vanzonexplorer.com/location",
      "Voir la location",
      article3
    )}

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0 16px;border-top:1px solid #1a1a1a;">
      <p style="margin:0 0 6px;font-size:13px;color:#555;">Vanzon Explorer · <a href="https://vanzonexplorer.com" style="color:#888;text-decoration:none;">vanzonexplorer.com</a></p>
      <p style="margin:0;font-size:11px;color:#333;">"Rendre accessible à tous le goût de la liberté"</p>
    </div>

  </div>
</body>
</html>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// Envoi
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("📧 Envoi des 3 articles de backlink SEO via Gmail API...");

  const html = buildEmailHtml();
  const id = await sendGmailEmail(
    "jules@vanzonexplorer.com",
    "📝 3 Articles Backlink SEO — Vanzon Explorer (Formation · Road Trip · Location PB)",
    html
  );

  console.log("✅ Email envoyé avec succès via Gmail API !");
  console.log("   Message ID :", id);
  console.log("   À          : jules@vanzonexplorer.com");
}

main().catch((err) => {
  console.error("❌ Erreur fatale :", err);
  process.exit(1);
});
