import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  message: z.string().optional(),
  vanId: z.string().optional(),
  vanName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── Validation Zod ──
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, message, vanId, vanName } = parsed.data;

    const apiKey = process.env.GOHIGHLEVEL_API_KEY;
    const locationId = process.env.NEXT_PUBLIC_GOHIGHLEVEL_LOCATION_ID;

    // ── Envoi vers GoHighLevel ──
    if (apiKey && locationId) {
      const ghlPayload = {
        firstName,
        lastName,
        email,
        phone,
        source: "vanzon-explorer-website",
        tags: ["lead-achat", "website"],
        customField: {
          vanId: vanId || "",
          vanName: vanName || "",
          message: message || "",
        },
      };

      const ghlResponse = await fetch(
        "https://rest.gohighlevel.com/v1/contacts/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(ghlPayload),
        }
      );

      if (!ghlResponse.ok) {
        const errorText = await ghlResponse.text();
        console.error("[GoHighLevel] Erreur:", ghlResponse.status, errorText);
        return NextResponse.json(
          { error: "Erreur lors de l'envoi vers le CRM" },
          { status: 502 }
        );
      }
    } else {
      // Mode dev — log seulement
      console.log("[Contact] Lead reçu (mode dev, pas de GHL configuré):", {
        firstName,
        lastName,
        email,
        phone,
        message,
        vanId,
        vanName,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Contact] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
