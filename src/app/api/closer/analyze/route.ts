import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { ClosingAnalysis } from "@/types/closing-analysis";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ALLOWED_EMAILS = (process.env.ADMIN_EMAILS ?? "gavegliojules@gmail.com,vanzonexplorer@gmail.com,jules.skate64@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

async function requireAllowed(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? "";
  return ALLOWED_EMAILS.includes(email);
}

const SYSTEM_PROMPT = `Tu es un coach de closing d'élite spécialisé dans la vente high-ticket au téléphone/visio. Tu maîtrises et croises les meilleures méthodes du métier :
- NEPQ (Jeremy Miner) : questions de connexion, de situation, de conscience du problème, de conscience de la solution, de conséquence, d'engagement. Ton neutre et curieux, jamais "vendeur".
- Straight Line (Jordan Belfort) : certitude sur le produit / l'entreprise / le closer, tonalité, boucles (looping) sur les objections.
- Chris Voss (Never Split the Difference) : empathie tactique, labeling ("on dirait que…"), mirroring, questions calibrées ("comment", "qu'est-ce qui"), le "non" qui rassure.
- Gap Selling (Keenan) : état actuel vs état désiré, chiffrer le coût de l'inaction.
- Sandler : pain funnel, upfront contract (cadre posé en début d'appel), negative reverse selling.
- Alex Hormozi : value equation, cadre CLOSER, isoler l'objection avant de la traiter.

CONTEXTE PRODUIT (essentiel pour juger la pertinence des réponses du closer) :
- Produit : Van Business Academy (VBA), formation à 997€ (tarif de lancement) qui apprend à lancer un business de van aménagé mis en location. Un van bien géré rapporte ~6 000 à 8 000€ net/an en location sur les plateformes (Yescapa, Wikicampers), plus une plus-value possible à la revente. Pas besoin d'être bricoleur ni commercial.
- Tunnel : pub Meta → opt-in email → VSL (vidéo de vente) → appel Calendly → closing → paiement Stripe.
- Prospects typiques : gens qui veulent créer un revenu complémentaire ou passif avec un van, souvent débutants, parfois salariés en quête de liberté. Objections classiques : le prix (997€), "je vais réfléchir", le/la conjoint(e), le manque de temps, la peur de ne pas y arriver, "je ne suis pas bricoleur", "est-ce que ça marche vraiment ?".

TA MISSION : analyser le transcript d'un appel de closing et rendre un feedback CONCRET, OBJECTIF et BRUTALEMENT HONNÊTE. Objectif = faire progresser le closer, pas le flatter.
Règles :
- Zéro complaisance. Si l'appel est mauvais, dis-le clairement et explique pourquoi. Si un point est bon, dis-le aussi (l'honnêteté va dans les deux sens).
- Chaque affirmation doit s'appuyer sur une PREUVE : cite des extraits réels et courts du transcript (verbatim). N'invente jamais de citation.
- Pour chaque faiblesse, donne la MEILLEURE alternative concrète, avec un exemple de phrase exacte que le closer aurait dû dire.
- Juge la pertinence par rapport au produit VBA et au profil du prospect, pas dans l'abstrait.
- Si le transcript est trop court, incomplet, ou n'est pas un appel de closing, mets verdict.outcome = "indetermine" et explique-le dans le résumé, tout en analysant ce qui est analysable.

Note chaque critère de la rubrique sur 10 : cadre & tonalité (upfront contract, posture haute et calme) ; découverte / diagnostic (douleur racine, "pourquoi maintenant", coût de l'inaction chiffré) ; écoute active (ratio de parole, questions vs monologue) ; création de valeur (lien explicite entre le besoin du prospect et l'offre, gap) ; présentation de l'offre & ancrage du prix ; traitement des objections (isoler, valider, reframer, boucler) ; demande de vente claire + silence après le closing ; levier émotionnel vs justification logique ; engagement & prochaines étapes.

FORMAT DE SORTIE — TRÈS IMPORTANT :
Réponds UNIQUEMENT avec un objet JSON valide, en français, sans aucun texte avant ou après, sans balises markdown, sans \`\`\`. Le JSON doit respecter EXACTEMENT ce schéma :
{
  "verdict": { "outcome": "signe" | "perdu" | "a_suivre" | "indetermine", "score": number (0-100), "resume": string },
  "criteres": [ { "nom": string, "note": number (0-10), "commentaire": string } ],
  "points_forts": [ { "point": string, "extrait": string } ],
  "points_faibles": [ { "point": string, "extrait": string, "impact": string } ],
  "occasions_manquees": [ { "moment": string, "ce_qui_s_est_passe": string, "meilleur_move": string, "exemple_phrase": string } ],
  "objections": [ { "objection": string, "ta_reponse": string, "note": "bien" | "moyen" | "rate", "mieux": string } ],
  "ratio_parole": { "estimation": string, "verdict": string },
  "reformulations": [ { "tu_as_dit": string, "dis_plutot": string, "pourquoi": string } ],
  "priorites": [ string ],
  "exercices": [ string ]
}
"priorites" = les 3 chantiers prioritaires classés du plus impactant au moins. "exercices" = 2 à 4 drills concrets à travailler.`;

function extractJson(raw: string): unknown {
  let text = raw.trim();
  // Retire d'éventuelles balises markdown
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) text = fenceMatch[1].trim();
  // Sinon isole le premier { … dernier }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    text = text.slice(first, last + 1);
  }
  return JSON.parse(text);
}

export async function POST(req: Request) {
  if (!(await requireAllowed())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY manquante côté serveur." }, { status: 500 });
  }

  let body: { transcript?: string; title?: string; prospect?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const transcript = (body.transcript ?? "").trim();
  const title = (body.title ?? "").trim() || null;
  const prospect = (body.prospect ?? "").trim() || null;

  if (transcript.length < 80) {
    return NextResponse.json(
      { error: "Colle un transcript d'appel plus complet (au moins quelques échanges)." },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey });

  let analysis: ClosingAnalysis;
  try {
    // thinking adaptatif : passé via cast car le SDK installé (0.82) ne type pas encore ce champ.
    const params = {
      model: "claude-opus-4-8",
      max_tokens: 12000,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content:
            `Voici le transcript d'un appel de closing à analyser.` +
            (prospect ? `\nProspect : ${prospect}` : "") +
            (title ? `\nContexte : ${title}` : "") +
            `\n\n--- TRANSCRIPT ---\n${transcript}\n--- FIN DU TRANSCRIPT ---\n\n` +
            `Analyse-le selon tes règles et réponds uniquement avec le JSON demandé.`,
        },
      ],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await client.messages.create(params as any);

    const textBlock = (response.content as Array<{ type: string; text?: string }>).find(
      (b) => b.type === "text",
    );
    if (!textBlock?.text) {
      throw new Error("Réponse vide du modèle.");
    }
    analysis = extractJson(textBlock.text) as ClosingAnalysis;
  } catch (err) {
    console.error("[closer/analyze] erreur:", err);
    return NextResponse.json(
      { error: "L'analyse a échoué. Réessaie dans un instant." },
      { status: 502 },
    );
  }

  const score =
    typeof analysis?.verdict?.score === "number" ? Math.round(analysis.verdict.score) : null;

  // Persistance best-effort : l'analyse est renvoyée même si la table n'existe pas encore.
  let savedRow: unknown = null;
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("closing_analyses")
      .insert({ title, prospect, transcript, analysis, score })
      .select("*")
      .single();
    if (error) {
      console.warn("[closer/analyze] insert non persisté:", error.message);
    } else {
      savedRow = data;
    }
  } catch (e) {
    console.warn("[closer/analyze] Supabase indisponible:", e);
  }

  return NextResponse.json({
    analysis,
    saved: savedRow,
  });
}
