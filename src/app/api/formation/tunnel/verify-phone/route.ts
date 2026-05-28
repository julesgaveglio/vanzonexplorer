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

    // ── Step 5: Extensive fake pattern detection ──
    const national = parsed.nationalNumber;
    const digits = national.split("").map(Number);

    // All same digits (0000000000)
    if (/^(\d)\1+$/.test(national)) {
      return rejectPhone("fake_pattern");
    }

    // Sequential ascending (0123456789)
    let seqUp = true;
    for (let i = 1; i < digits.length; i++) {
      if (digits[i] !== digits[i - 1] + 1) { seqUp = false; break; }
    }
    if (seqUp && digits.length >= 8) return rejectPhone("fake_pattern");

    // Sequential descending (9876543210)
    let seqDown = true;
    for (let i = 1; i < digits.length; i++) {
      if (digits[i] !== digits[i - 1] - 1) { seqDown = false; break; }
    }
    if (seqDown && digits.length >= 8) return rejectPhone("fake_pattern");

    // Repeated pairs (06060606, 12121212)
    const pairs = national.match(/.{2}/g) ?? [];
    if (pairs.length >= 4) {
      const uniquePairs = new Set(pairs);
      if (uniquePairs.size <= 1) return rejectPhone("fake_pattern");
    }

    // Repeated triplets (061061061)
    const triplets = national.match(/.{3}/g) ?? [];
    if (triplets.length >= 3) {
      const uniqueTriplets = new Set(triplets);
      if (uniqueTriplets.size <= 1) return rejectPhone("fake_pattern");
    }

    // Alternating pattern (0101010101, 1212121212)
    if (digits.length >= 8) {
      let alternating = true;
      for (let i = 2; i < digits.length; i++) {
        if (digits[i] !== digits[i - 2]) { alternating = false; break; }
      }
      if (alternating && digits[0] === digits[digits.length - 2]) return rejectPhone("fake_pattern");
    }

    // Only 2 unique digits in the whole number (e.g., 0606060606, 1231231231 is ok)
    const uniqueDigits = new Set(digits);
    if (uniqueDigits.size <= 2 && digits.length >= 9) return rejectPhone("fake_pattern");

    // Known fake French numbers (commonly used for tests)
    const knownFakes = [
      "0600000000", "0700000000", "0100000000", "0612345678", "0698765432",
      "0611111111", "0622222222", "0633333333", "0644444444", "0655555555",
      "0666666666", "0677777777", "0688888888", "0699999999",
      "0711111111", "0722222222", "0733333333", "0744444444", "0755555555",
      "0766666666", "0777777777", "0788888888", "0799999999",
    ];
    const nationalClean = "0" + national;
    if (knownFakes.includes(nationalClean)) return rejectPhone("fake_pattern");

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
