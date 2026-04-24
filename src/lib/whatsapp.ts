// WhatsApp Business Cloud API — send messages
// Requires: WHATSAPP_PHONE_ID + WHATSAPP_ACCESS_TOKEN in env

const WHATSAPP_API = "https://graph.facebook.com/v21.0";

export async function sendWhatsAppMessage(
  to: string,
  text: string
): Promise<boolean> {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneId || !token) {
    console.warn("[whatsapp] Missing WHATSAPP_PHONE_ID or WHATSAPP_ACCESS_TOKEN");
    return false;
  }

  // Format phone: remove spaces, ensure starts with country code
  const formattedPhone = to.replace(/\s/g, "").replace(/^\+/, "");

  try {
    const res = await fetch(`${WHATSAPP_API}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: { body: text },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("[whatsapp] Send error:", err);
      return false;
    }

    console.log(`[whatsapp] Message sent to ${formattedPhone}`);
    return true;
  } catch (err) {
    console.error("[whatsapp] Error:", err);
    return false;
  }
}
