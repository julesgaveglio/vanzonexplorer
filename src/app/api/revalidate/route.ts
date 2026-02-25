import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // ── Vérification du secret webhook ──
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const type = body?._type as string | undefined;

    // ── Revalidation selon le type de document modifié ──
    switch (type) {
      case "van":
        revalidatePath("/location");
        revalidatePath("/achat");
        revalidatePath("/"); // vans vedettes en page d'accueil
        break;
      case "testimonial":
        revalidatePath("/");
        break;
      case "spotPaysBasque":
        revalidatePath("/pays-basque");
        break;
      default:
        // Revalidation générale en fallback
        revalidatePath("/");
    }

    return NextResponse.json({
      revalidated: true,
      type: type ?? "unknown",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Error revalidating", error: String(error) },
      { status: 500 }
    );
  }
}
