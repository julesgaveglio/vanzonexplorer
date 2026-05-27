import { NextResponse } from "next/server";
import { parsePhoneNumberFromString, isValidPhoneNumber } from "libphonenumber-js";
import { trackVerification, checkRejectionRateAndAlert } from "@/lib/ads-monitor";

function rejectPhone(reason: string) {
  trackVerification("phone", null, false, reason).catch(() => {});
  checkRejectionRateAndAlert().catch(() => {});
  return NextResponse.json({ valid: false, reason });
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ valid: false, reason: "missing" });
    }

    const trimmed = phone.trim();

    // ── Step 1: Parse with Google's libphonenumber ──
    // Try French first, then international
    const parsed = parsePhoneNumberFromString(trimmed, "FR");

    if (!parsed) {
      return rejectPhone("parse_failed");
    }

    // ── Step 2: Validate the number ──
    if (!parsed.isValid()) {
      return rejectPhone("invalid_number");
    }

    // ── Step 3: Check it's a possible number (correct length for the country) ──
    if (!parsed.isPossible()) {
      return rejectPhone("impossible_number");
    }

    // ── Step 4: Get number type ──
    const numberType = parsed.getType();
    // Block premium, toll-free, voip-only (common for fake signups)
    const blockedTypes = ["PREMIUM_RATE", "TOLL_FREE", "SHARED_COST", "UAN", "VOICEMAIL"];
    if (numberType && blockedTypes.includes(numberType)) {
      return rejectPhone("blocked_type");
    }

    // ── Step 5: Additional pattern checks ──
    const national = parsed.nationalNumber;

    // All same digits
    if (/^(\d)\1+$/.test(national)) {
      return rejectPhone("fake_pattern");
    }

    // Sequential (012345, 987654)
    const digits = national.split("").map(Number);
    let sequential = true;
    for (let i = 1; i < digits.length; i++) {
      if (digits[i] !== digits[i - 1] + 1 && digits[i] !== digits[i - 1] - 1) {
        sequential = false;
        break;
      }
    }
    if (sequential && digits.length >= 8) {
      return rejectPhone("fake_pattern");
    }

    // Repeated pairs (06060606)
    const pairs = national.match(/.{2}/g) ?? [];
    if (pairs.length >= 4) {
      const uniquePairs = new Set(pairs);
      if (uniquePairs.size <= 1) {
        return rejectPhone("fake_pattern");
      }
    }

    // ── Step 6: Double-check with isValidPhoneNumber (belt & suspenders) ──
    const international = parsed.format("E.164");
    if (!isValidPhoneNumber(international)) {
      return rejectPhone("invalid_e164");
    }

    // ── All good ──
    trackVerification("phone", null, true, "verified").catch(() => {});
    return NextResponse.json({
      valid: true,
      reason: "verified",
      country: parsed.country ?? "unknown",
      type: numberType ?? "unknown",
      formatted: parsed.formatInternational(),
    });
  } catch {
    // Error → don't block
    return NextResponse.json({ valid: true, reason: "error_passthrough" });
  }
}
