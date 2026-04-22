import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (webhookSecret && sig) {
    try {
      event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error("[stripe/webhook] Signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } else {
    event = JSON.parse(body) as Stripe.Event;
  }

  const supabase = createSupabaseAdmin();

  // Payment unique or first installment payment
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const clerkUserId = session.metadata?.clerk_user_id;
    const product = session.metadata?.product;

    if (clerkUserId && product === "vba") {
      const { error } = await supabase
        .from("profiles")
        .update({ plan: "vba_member" })
        .eq("clerk_id", clerkUserId);

      if (error) {
        console.error("[stripe/webhook] Supabase update error:", error);
      } else {
        console.log(`[stripe/webhook] User ${clerkUserId} upgraded to vba_member`);
      }
    }
  }

  // Auto-cancel subscription after 4 payments
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionId = (invoice as any).subscription as string | undefined;

    if (subscriptionId) {
      try {
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        const cancelAfter = subscription.metadata?.cancel_after_payments;

        if (cancelAfter) {
          // Count paid invoices for this subscription
          const invoices = await getStripe().invoices.list({
            subscription: subscriptionId,
            status: "paid",
            limit: 10,
          });

          if (invoices.data.length >= parseInt(cancelAfter, 10)) {
            await getStripe().subscriptions.cancel(subscriptionId);
            console.log(`[stripe/webhook] Subscription ${subscriptionId} cancelled after ${cancelAfter} payments`);
          }
        }
      } catch (err) {
        console.error("[stripe/webhook] Auto-cancel error:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
