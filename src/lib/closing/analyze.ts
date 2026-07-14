import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";
import type { ClosingAnalysis, ClosingContext } from "@/types/closing-analysis";

// Moteur d'analyse de closing partagé (route API + script de sync mémoire).

// Empreinte stable d'un transcript, pour éviter les doublons à l'import.
export function transcriptHash(transcript: string): string {
  return createHash("sha256").update(transcript.trim()).digest("hex");
}

const SYSTEM_PROMPT = `Tu es un coach de closing d'élite spécialisé dans la vente high-ticket au téléphone/visio. Tu maîtrises et croises les meilleures méthodes du métier :
- NEPQ (Jeremy Miner) : questions de connexion, de situation, de conscience du problème, de conscience de la solution, de conséquence, d'engagement. Ton neutre et curieux, jamais "vendeur".
- Straight Line (Jordan Belfort) : certitude sur le produit / l'entreprise / le closer, tonalité, boucles (looping) sur les objections.
- Chris Voss (Never Split the Difference) : empathie tactique, labeling ("on dirait que…"), mirroring, questions calibrées ("comment", "qu'est-ce qui"), le "non" qui rassure.
- Gap Selling (Keenan) : état actuel vs état désiré, chiffrer le coût de l'inaction.
- Sandler : pain funnel, upfront contract (cadre posé en début d'appel), negative reverse selling.
- Alex Hormozi : value equation, cadre CLOSER, isoler l'objection avant de la traiter.

CONTEXTE PRODUIT (essentiel pour juger la pertinence des réponses du closer) :
- Produit : Van Business Academy (VBA), formation à 997€ (tarif de lancement) qui apprend à lancer un business de van aménagé mis en location. Un van bien géré rapporte ~6 000 à 8 000€ net/an en location (Yescapa, Wikicampers), plus une plus-value possible à la revente. Pas besoin d'être bricoleur ni commercial.
- Tunnel : pub Meta → opt-in email → VSL → appel Calendly → closing → paiement Stripe.
- Prospects typiques : gens qui veulent créer un revenu complémentaire ou passif avec un van, souvent débutants. Objections classiques : le prix (997€), "je vais réfléchir", le/la conjoint(e), le manque de temps, la peur de ne pas y arriver, "je ne suis pas bricoleur", "est-ce que ça marche vraiment ?".

TA MISSION a DEUX parties :

1) EXTRAIRE LA FICHE (contexte concret) — pour ranger l'appel dans une base de données. Récupère tout ce qui est factuel : identité (prénom, nom si dit), âge, ville/région/pays, métier/situation, projet (voyage ? business ? location ?), budgets (véhicule, aménagement), canal de contact (WhatsApp, téléphone…), statut du deal, résultat, offre proposée, montant, objections réelles, signaux d'achat, chiffres clés, verbatims marquants, prochaines étapes. N'invente RIEN : si une info n'est pas dans le transcript, mets null (ou liste vide).

ATTRIBUTION MARKETING (champ "acquisition") — très important : déduis du transcript D'OÙ vient le prospect. Les gens disent souvent où ils ont découvert Vanzon ("j'ai vu sur Instagram", "je suis tombé sur votre pub", "j'ai vu une vidéo TikTok", "j'ai cherché sur Google"…). Classe le canal parmi : "Meta Ads", "Google Ads", "SEO / Google organique", "Facebook (organique)", "Instagram", "TikTok", "YouTube", "Bouche-à-oreille", "Autre", "Inconnu". Précise si c'est payant ou organique quand c'est déductible ("pub"/"sponsorisé" = payant ; "j'ai vu une vidéo/un post" = organique). Mets l'indice exact du transcript qui justifie ta déduction. Si aucun indice, canal = "Inconnu", type = "inconnu".

2) ANALYSER LE CLOSING — feedback CONCRET, OBJECTIF, BRUTALEMENT HONNÊTE. Objectif = faire progresser le closer, pas le flatter.
Règles :
- Zéro complaisance. Si l'appel est mauvais, dis-le et explique pourquoi. Si un point est bon, dis-le aussi.
- Chaque affirmation s'appuie sur une PREUVE : cite des extraits réels et courts du transcript (verbatim). N'invente jamais de citation.
- Pour chaque faiblesse, donne la MEILLEURE alternative concrète, avec un exemple de phrase exacte à dire.
- Juge la pertinence par rapport au produit VBA et au profil du prospect.
- Si le transcript est trop court/incomplet ou n'est pas un closing, mets verdict.outcome = "indetermine" et explique-le, tout en analysant ce qui est analysable.

Note chaque critère sur 10 : cadre & tonalité ; découverte/diagnostic (douleur racine, "pourquoi maintenant", coût de l'inaction chiffré) ; écoute active (ratio de parole) ; création de valeur (lien besoin↔offre) ; présentation offre & ancrage prix ; traitement des objections (isoler, valider, reframer, boucler) ; demande de vente claire + silence ; levier émotionnel vs logique ; engagement & prochaines étapes.

FORMAT DE SORTIE — TRÈS IMPORTANT :
Réponds UNIQUEMENT avec un objet JSON valide, en français, sans texte avant/après, sans balises markdown. Schéma EXACT :
{
  "contexte": {
    "prenom": string|null, "nom": string|null, "age": number|null,
    "ville": string|null, "region": string|null, "pays": string|null,
    "metier": string|null, "situation": string|null, "projet": string|null,
    "objectif_business": boolean|null,
    "budget_vehicule": string|null, "budget_amenagement": string|null,
    "acquisition": { "canal": string|null, "type": "payant"|"organique"|"inconnu"|null, "detail": string|null, "indice": string|null },
    "canal": string|null,
    "statut": string|null, "resultat": string|null,
    "offre_proposee": string|null, "montant": string|null,
    "objections": [string], "signaux_achat": [string], "chiffres_cles": [string],
    "verbatims": [string], "next_steps": [string], "resume": string|null
  },
  "verdict": { "outcome": "signe"|"perdu"|"a_suivre"|"indetermine", "score": number, "resume": string },
  "criteres": [ { "nom": string, "note": number, "commentaire": string } ],
  "points_forts": [ { "point": string, "extrait": string } ],
  "points_faibles": [ { "point": string, "extrait": string, "impact": string } ],
  "occasions_manquees": [ { "moment": string, "ce_qui_s_est_passe": string, "meilleur_move": string, "exemple_phrase": string } ],
  "objections": [ { "objection": string, "ta_reponse": string, "note": "bien"|"moyen"|"rate", "mieux": string } ],
  "ratio_parole": { "estimation": string, "verdict": string },
  "reformulations": [ { "tu_as_dit": string, "dis_plutot": string, "pourquoi": string } ],
  "priorites": [ string ],
  "exercices": [ string ]
}
"priorites" = les 3 chantiers prioritaires (du plus impactant au moins). "exercices" = 2 à 4 drills concrets.`;

export interface AnalyzeInput {
  transcript: string;
  prospect?: string | null;
  title?: string | null;
  closer?: string | null;
  callDate?: string | null;
}

export interface AnalyzeResult {
  analysis: ClosingAnalysis;
  context: ClosingContext;
}

function extractJson(raw: string): Record<string, unknown> {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) text = text.slice(first, last + 1);
  return JSON.parse(text) as Record<string, unknown>;
}

export async function analyzeClosingTranscript(input: AnalyzeInput): Promise<AnalyzeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquante.");

  const client = new Anthropic({ apiKey });

  const meta = [
    input.prospect ? `Prospect connu : ${input.prospect}` : "",
    input.closer ? `Closer : ${input.closer}` : "",
    input.callDate ? `Date de l'appel : ${input.callDate}` : "",
    input.title ? `Contexte : ${input.title}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  // thinking adaptatif passé via cast (SDK 0.82 ne type pas encore ce champ).
  const params = {
    model: "claude-opus-4-8",
    max_tokens: 14000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content:
          `Analyse le transcript d'appel de closing ci-dessous.` +
          (meta ? `\n${meta}` : "") +
          `\n\n--- TRANSCRIPT ---\n${input.transcript}\n--- FIN DU TRANSCRIPT ---\n\n` +
          `Réponds uniquement avec le JSON demandé (contexte + analyse).`,
      },
    ],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await client.messages.create(params as any);
  const textBlock = (response.content as Array<{ type: string; text?: string }>).find(
    (b) => b.type === "text",
  );
  if (!textBlock?.text) throw new Error("Réponse vide du modèle.");

  const parsed = extractJson(textBlock.text);
  const context = (parsed.contexte ?? {}) as ClosingContext;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { contexte, ...analysis } = parsed;
  return { analysis: analysis as unknown as ClosingAnalysis, context };
}
