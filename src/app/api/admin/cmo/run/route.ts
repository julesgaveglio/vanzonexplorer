import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import Groq from "groq-sdk";

function getCurrentSeason(): "haute" | "moyenne" | "basse" {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const mmdd = month * 100 + day;
  if (mmdd >= 415 && mmdd <= 915) return "haute";
  if ((mmdd >= 301 && mmdd < 415) || (mmdd > 915 && mmdd <= 1031)) return "moyenne";
  return "basse";
}

const WEEKLY_PROMPT = (season: string) =>
  `Tu es le Directeur Marketing 360° de Vanzon Explorer (location/vente vans aménagés, Pays Basque). Saison actuelle : ${season}. Génère le rapport marketing hebdomadaire. Produis un JSON strict sans markdown : { "summary": "...", "top_actions": [{ "title": "...", "channel": "acquisition|content|retention|reputation|intelligence", "ice_score": 72, "effort": "low|medium|high", "rationale": "..." }] }. Exactement 3 actions. JSON valide, pas de texte autour.`;

const MONTHLY_PROMPT = (season: string) =>
  `Tu es le Directeur Marketing 360° de Vanzon Explorer (location/vente vans aménagés, Pays Basque). Saison actuelle : ${season}. Génère l'audit marketing mensuel complet. Produis un JSON strict sans markdown : { "health_score": 74, "health_breakdown": { "acquisition": 70, "content": 65, "retention": 80, "reputation": 75, "intelligence": 72 }, "aarrr": { "acquisition": "...", "activation": "...", "retention": "...", "referral": "...", "revenue": "..." }, "actions": [{ "title": "...", "channel": "acquisition|content|retention|reputation|intelligence", "ice_score": 72, "effort": "low|medium|high", "rationale": "..." }], "alerts": [], "summary": "..." }. 10-15 actions. health_score = acquisition×0.25 + content×0.20 + retention×0.20 + reputation×0.20 + intelligence×0.15. JSON valide, pas de texte autour.`;

type GeneratedReport = {
  content: Record<string, unknown>;
  health_score?: number;
  actions: ActionInput[];
};

type ActionInput = {
  title: string;
  channel: string;
  ice_score: number;
  effort: "low" | "medium" | "high";
};

async function generateReport(type: "weekly" | "monthly"): Promise<GeneratedReport> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const season = getCurrentSeason();
  const prompt = type === "weekly" ? WEEKLY_PROMPT(season) : MONTHLY_PROMPT(season);

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: type === "monthly" ? 3000 : 1024,
    temperature: 0.3,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const rawActions = type === "weekly"
    ? (parsed.top_actions as ActionInput[] | undefined)
    : (parsed.actions as ActionInput[] | undefined);

  return {
    content: parsed,
    health_score: typeof parsed.health_score === "number" ? parsed.health_score : undefined,
    actions: rawActions ?? [],
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    type: "weekly" | "monthly" | "adhoc";
    trigger?: boolean;
    content?: Record<string, unknown>;
    health_score?: number;
    period_label?: string;
    actions?: ActionInput[];
  };

  const { type, trigger } = body;
  let content = body.content ?? {};
  let health_score = body.health_score;
  let actions: ActionInput[] = body.actions ?? [];

  // Mode trigger : générer le rapport inline via Groq
  if (trigger && (type === "weekly" || type === "monthly")) {
    try {
      const generated = await generateReport(type);
      content = generated.content;
      health_score = generated.health_score;
      actions = generated.actions;
    } catch (err) {
      return NextResponse.json(
        { error: `Génération échouée : ${err instanceof Error ? err.message : String(err)}` },
        { status: 500 }
      );
    }
  }

  const now = new Date();
  const autoLabel =
    type === "weekly"
      ? `Semaine ${Math.ceil(now.getDate() / 7)} — ${now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`
      : now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const supabase = createSupabaseAdmin();

  const { data: report, error: reportError } = await supabase
    .from("cmo_reports")
    .insert({
      type,
      content,
      health_score: health_score ?? null,
      period_label: body.period_label ?? autoLabel,
    })
    .select("id")
    .single();

  if (reportError || !report) {
    return NextResponse.json({ error: reportError?.message }, { status: 500 });
  }

  // Déduplication + insertion des actions
  if (actions.length > 0) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: recentDone } = await supabase
      .from("cmo_actions")
      .select("title, channel")
      .eq("status", "done")
      .gte("created_at", thirtyDaysAgo);

    const doneSet = new Set((recentDone ?? []).map((a) => `${a.title}__${a.channel}`));

    const toInsert = actions
      .filter((a) => !doneSet.has(`${a.title}__${a.channel}`))
      .map((a) => ({ ...a, report_id: report.id }));

    if (toInsert.length > 0) {
      await supabase.from("cmo_actions").insert(toInsert);
    }
  }

  return NextResponse.json({ id: report.id });
}
