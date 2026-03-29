import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const type = body?._type as string | undefined;

    switch (type) {
      case "van":
        revalidatePath("/location", "layout");  // revalide /location/* (toutes les pages vans)
        revalidatePath("/achat");
        revalidatePath("/");
        break;
      case "testimonial":
        revalidatePath("/");
        break;
      case "spotPaysBasque":
        revalidatePath("/pays-basque");
        break;
      default:
        revalidatePath("/");
    }

    // ── Vercel deploy hook optionnel (pour rebuild complet si besoin) ──
    const deployHook = process.env.VERCEL_DEPLOY_HOOK_URL;
    if (deployHook && type === "van") {
      fetch(deployHook, { method: "POST" }).catch(err =>
        console.warn("[revalidate] deploy hook failed:", err)
      );
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
