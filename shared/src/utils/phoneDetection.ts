/**
 * Canonical phone-number detection primitive (P1-7 / D-04).
 *
 * Single owner per DECISION-GATE §3: one `detectPhoneNumbers` in `@esparex/shared`.
 * Replaces the two divergent `PHONE_REGEX` definitions:
 * - `core/src/services/lifecycle/ModerationService.ts:14` (legacy moderation flagging)
 * - `core/src/domains/communications/application/services/chat/ChatUtils.ts:17`
 *   (chat fraud scoring + PII masking)
 *
 * The pattern is intentionally the broader of the two legacy patterns: every
 * string the legacy moderation detector flagged is also detected here, so PII
 * masking can never regress (the D-04 privacy risk was a number masked in chat
 * not matching the moderation detector, or vice versa).
 *
 * The regex is rebuilt per call (never shared with the /g flag) because a
 * shared global regex is stateful (`lastIndex`), which made the legacy
 * `PHONE_REGEX.test(...)` calls order-dependent.
 */

const PHONE_PATTERN_SOURCE = String.raw`(\+?\d[\d\s\-().]{6,}\d)`;

function freshPhoneRegex(): RegExp {
  return new RegExp(PHONE_PATTERN_SOURCE, "g");
}

/**
 * Returns every phone-number-like substring found in `text`.
 */
export function detectPhoneNumbers(text: string): string[] {
  if (!text) return [];
  return text.match(freshPhoneRegex()) ?? [];
}

/**
 * Boolean probe — replaces the legacy `PHONE_REGEX.test(text)` call sites.
 */
export function containsPhoneNumber(text: string): boolean {
  return detectPhoneNumbers(text).length > 0;
}

/**
 * Masks every detected phone number with `replacement` (default `"[phone hidden]"`).
 * Replaces the legacy `text.replace(PHONE_REGEX, "[phone hidden]")` call sites.
 */
export function maskPhoneNumbers(
  text: string,
  replacement = "[phone hidden]"
): string {
  if (!text) return text;
  return text.replace(freshPhoneRegex(), replacement);
}
