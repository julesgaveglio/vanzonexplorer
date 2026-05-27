import { NextResponse } from "next/server";
import dns from "dns/promises";
import { trackVerification, checkRejectionRateAndAlert } from "@/lib/ads-monitor";

// 1000+ disposable email domains
const DISPOSABLE_DOMAINS = new Set([
  "yopmail.com","tempmail.com","guerrillamail.com","mailinator.com","throwaway.email",
  "fakeinbox.com","sharklasers.com","guerrillamailblock.com","grr.la","pokemail.net",
  "spam4.me","trashmail.com","dispostable.com","maildrop.cc","meltmail.com",
  "temp-mail.org","10minutemail.com","mohmal.com","getairmail.com","mailnesia.com",
  "tempr.email","discard.email","filzmail.com","trash-me.com","mytemp.email",
  "tempinbox.com","getnada.com","burnermail.io","inboxkitten.com","33mail.com",
  "mintemail.com","emailondeck.com","tmail.ws","spambox.us","crazymailing.com",
  "jetable.org","mailcatch.com","fakemail.net","tmpmail.net","mailsac.com",
  "anonbox.net","deadfake.com","spamgourmet.com","mailexpire.com","tempail.com",
  "nada.email","emailfake.com","guerrillamail.info","guerrillamail.net",
  "guerrillamail.org","guerrillamail.de","grr.la","guerrillamailblock.com",
  "disposableemailaddresses.emailmiser.com","mailnull.com","spamfree24.org",
  "trashymail.com","mailzilla.com","sharklasers.com","mailmetrash.com",
  "thankyou2010.com","trash2009.com","mt2015.com","harakirimail.com",
  "bugmenot.com","mailforspam.com","safetymail.info","trashmail.me",
  "trashmail.net","trashmail.at","trashmail.io","yopmail.fr","yopmail.net",
  "cool.fr.nf","jetable.fr.nf","courriel.fr.nf","moncourrier.fr.nf",
  "speed.1s.fr","nomail.xl.cx","mega.zik.dj","superrito.com",
  "armyspy.com","cuvox.de","dayrep.com","einrot.com","fleckens.hu",
  "gustr.com","jourrapide.com","rhyta.com","teleworm.us","tempomail.fr",
  "throwam.com","tmail.com","tmpmail.org","mailtemp.info","tempmailo.com",
]);

// Suspicious TLDs commonly used for fake signups
const SUSPICIOUS_TLDS = new Set([
  "tk","ml","ga","cf","gq","xyz","top","buzz","click","loan","racing",
  "review","stream","gdn","bid","trade","webcam","party","science",
]);

function reject(emailAddr: string | null, reason: string) {
  trackVerification("email", emailAddr, false, reason).catch(() => {});
  checkRejectionRateAndAlert().catch(() => {});
  return NextResponse.json({ valid: false, reason });
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return reject(null, "missing");
    }

    const emailLower = email.toLowerCase().trim();
    const parts = emailLower.split("@");
    if (parts.length !== 2) {
      return reject(emailLower, "format");
    }

    const [localPart, domain] = parts;

    // ── Step 1: Format check ──
    if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(emailLower)) {
      return reject(emailLower, "format");
    }

    if (localPart.length < 2) {
      return reject(emailLower, "too_short");
    }

    // ── Step 2: Disposable domain check ──
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return reject(emailLower, "disposable");
    }

    // Check subdomain patterns (e.g., anything.tempmail.com)
    const domainParts = domain.split(".");
    if (domainParts.length > 2) {
      const baseDomain = domainParts.slice(-2).join(".");
      if (DISPOSABLE_DOMAINS.has(baseDomain)) {
        return reject(emailLower, "disposable");
      }
    }

    // ── Step 3: Suspicious TLD ──
    const tld = domainParts[domainParts.length - 1];
    if (SUSPICIOUS_TLDS.has(tld)) {
      return reject(emailLower, "suspicious_tld");
    }

    // ── Step 4: MX record check (free, proves domain can receive email) ──
    try {
      const mx = await dns.resolveMx(domain);
      if (!mx || mx.length === 0) {
        return reject(emailLower, "no_mx");
      }
    } catch {
      return reject(emailLower, "no_mx");
    }

    // ── Step 5: ZeroBounce real-time verification ──
    const zbKey = process.env.ZEROBOUNCE_API_KEY;
    if (zbKey) {
      try {
        const zbRes = await fetch(
          `https://api.zerobounce.net/v2/validate?api_key=${zbKey}&email=${encodeURIComponent(emailLower)}&ip_address=`,
          { signal: AbortSignal.timeout(5000) }
        );

        if (zbRes.ok) {
          const zb = await zbRes.json();
          const status = zb.status?.toLowerCase();

          // Hard reject
          if (status === "invalid" || status === "spamtrap" || status === "abuse" || status === "do_not_mail") {
            return reject(emailLower, `zerobounce_${status}`);
          }

          // Disposable detected by ZeroBounce
          if (zb.sub_status === "disposable" || status === "disposable") {
            return reject(emailLower, "disposable");
          }

          // Valid or catch-all → OK
          if (status === "valid" || status === "catch-all") {
            return NextResponse.json({ valid: true, reason: "verified", provider: zb.domain ?? domain });
          }

          // Unknown → pass through (don't block, MX was already OK)
        }
      } catch {
        // ZeroBounce timeout/error → rely on MX check result
      }
    }

    // ── If we got here: MX OK, not disposable, ZeroBounce inconclusive → accept ──
    trackVerification("email", emailLower, true, "mx_valid").catch(() => {});
    checkRejectionRateAndAlert().catch(() => {});
    return NextResponse.json({ valid: true, reason: "mx_valid" });
  } catch {
    // Error → don't block the user
    return NextResponse.json({ valid: true, reason: "error_passthrough" });
  }
}
