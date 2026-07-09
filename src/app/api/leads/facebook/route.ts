import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getResource } from "@/lib/resources";

const schema = z.object({
  prenom: z.string().min(2, "Prenom requis"),
  nom: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  ressource: z.string().min(1, "Ressource requise"),
  source: z.string().min(1).default("facebook"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const resource = getResource(data.ressource);
    if (!resource) {
      return NextResponse.json(
        { error: "Ressource inconnue." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("leads_facebook").insert({
      prenom: data.prenom,
      nom: data.nom,
      email: data.email,
      ressource: data.ressource,
      source: data.source,
    });

    if (error) {
      console.error("[leads/facebook] Supabase error:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      fileUrl: resource.fileUrl,
      fileName: resource.fileName,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    console.error("[leads/facebook] Error:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
