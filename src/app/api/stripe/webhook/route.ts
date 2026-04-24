import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { clerkClient } from "@clerk/nextjs/server";
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
    const product = session.metadata?.product;

    if (product === "vba") {
      let clerkUserId = session.metadata?.clerk_user_id;

      // If user was anonymous (no Clerk account), create one from Stripe data
      if (!clerkUserId || clerkUserId === "anonymous") {
        const email =
          session.customer_details?.email ||
          session.customer_email ||
          null;
        const name = session.customer_details?.name || null;

        if (email) {
          try {
            clerkUserId = await findOrCreateClerkUser(email, name);
            console.log(
              `[stripe/webhook] Clerk user created/found: ${clerkUserId} for ${email}`
            );
          } catch (err) {
            console.error("[stripe/webhook] Clerk user creation error:", err);
          }
        }
      }

      // Update Supabase profile
      if (clerkUserId && clerkUserId !== "anonymous") {
        const { error } = await supabase
          .from("profiles")
          .upsert(
            {
              clerk_id: clerkUserId,
              plan: "vba_member",
              email:
                session.customer_details?.email ||
                session.customer_email ||
                null,
              full_name: session.customer_details?.name || null,
            },
            { onConflict: "clerk_id" }
          );

        if (error) {
          console.error("[stripe/webhook] Supabase update error:", error);
        } else {
          console.log(
            `[stripe/webhook] User ${clerkUserId} upgraded to vba_member`
          );
        }

        // Update funnel lead step
        const email =
          session.customer_details?.email || session.customer_email;
        if (email) {
          await supabase
            .from("vba_funnel_leads")
            .update({ step_reached: "purchased" })
            .eq("email", email);
        }

        // Notify Telegram
        notifyNewStudent(
          session.customer_details?.name || "Inconnu",
          session.customer_details?.email || session.customer_email || "—",
          session.amount_total ? session.amount_total / 100 : 0
        ).catch(() => {});
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
        const subscription =
          await getStripe().subscriptions.retrieve(subscriptionId);
        const cancelAfter = subscription.metadata?.cancel_after_payments;

        if (cancelAfter) {
          const invoices = await getStripe().invoices.list({
            subscription: subscriptionId,
            status: "paid",
            limit: 10,
          });

          if (invoices.data.length >= parseInt(cancelAfter, 10)) {
            await getStripe().subscriptions.cancel(subscriptionId);
            console.log(
              `[stripe/webhook] Subscription ${subscriptionId} cancelled after ${cancelAfter} payments`
            );
          }
        }
      } catch (err) {
        console.error("[stripe/webhook] Auto-cancel error:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}

/**
 * Find existing Clerk user by email or create a new one.
 * Sends a password setup email automatically via Clerk.
 */
async function findOrCreateClerkUser(
  email: string,
  name: string | null
): Promise<string> {
  const clerk = await clerkClient();

  // Check if user already exists
  const existing = await clerk.users.getUserList({
    emailAddress: [email],
    limit: 1,
  });

  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  // Parse name
  const nameParts = (name || "").trim().split(/\s+/);
  const firstName = nameParts[0] || undefined;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

  // Create new Clerk user — skipPasswordRequirement lets them set it later
  const newUser = await clerk.users.createUser({
    emailAddress: [email],
    firstName,
    lastName,
    skipPasswordRequirement: true,
  });

  // Send welcome email with sign-in link via Resend
  await sendWelcomeViaResend(email, firstName || "", newUser.id);

  return newUser.id;
}

async function sendWelcomeViaResend(
  email: string,
  firstname: string,
  clerkId: string
) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vanzonexplorer.com";
  const { Resend } = await import("resend");
  const resend = new Resend(resendKey);

  await resend.emails.send({
    from: "Vanzon Explorer <noreply@vanzonexplorer.com>",
    to: email,
    subject:
      "Bienvenue dans la Van Business Academy — Crée ton mot de passe",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
        <img src="https://cdn.sanity.io/images/lewexa74/production/1f483103ef15ee3549eab14ba2801d11b32a9055-313x313.png" width="48" height="48" alt="Vanzon" style="border-radius: 12px; margin-bottom: 24px;" />
        <h1 style="font-size: 22px; color: #0F172A; margin: 0 0 16px;">
          Bienvenue ${firstname ? firstname + " " : ""}!
        </h1>
        <p style="font-size: 15px; color: #64748B; line-height: 1.6; margin: 0 0 24px;">
          Ton paiement a bien été reçu. Ta formation Van Business Academy est prête.
          Clique ci-dessous pour créer ton mot de passe et accéder à tes modules.
        </p>
        <a href="${siteUrl}/sign-in" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #B9945F 0%, #E4D398 100%); color: white; font-weight: 700; font-size: 15px; text-decoration: none; border-radius: 12px;">
          Créer mon mot de passe →
        </a>
        <p style="font-size: 12px; color: #94A3B8; margin-top: 20px;">
          ID compte : ${clerkId}
        </p>
      </div>
    `,
  });
}

async function notifyNewStudent(
  name: string,
  email: string,
  amount: number
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text =
    `🎉 <b>NOUVEL ÉLÈVE VBA !</b>\n` +
    `─────────────────────\n` +
    `<b>Nom :</b> ${name}\n` +
    `<b>Email :</b> ${email}\n` +
    `<b>Montant :</b> ${amount}€\n` +
    `─────────────────────\n` +
    `Compte Clerk créé automatiquement.\n` +
    `<a href="https://vanzonexplorer.com/admin/vba">👉 Admin VBA</a>`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}
