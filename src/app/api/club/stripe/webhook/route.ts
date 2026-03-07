import { getStripe } from "@/lib/club/stripe";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET || "");
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const clerkId = session.metadata?.clerk_id;

    if (clerkId) {
      await supabase
        .from("profiles")
        .update({
          subscription_status: "pro",
          stripe_customer_id: session.customer as string,
          updated_at: new Date().toISOString(),
        })
        .eq("clerk_id", clerkId);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const customerId = subscription.customer as string;

    const { data: profile } = await supabase
      .from("profiles")
      .select("clerk_id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({ subscription_status: "free", updated_at: new Date().toISOString() })
        .eq("clerk_id", profile.clerk_id);
    }
  }

  return NextResponse.json({ received: true });
}
