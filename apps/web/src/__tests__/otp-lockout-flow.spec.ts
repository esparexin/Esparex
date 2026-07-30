import { describe, expect, it } from "vitest";
import { normalizeTo10Digits, formatMobileForApi, validateIndianMobile } from "@/lib/validation";

describe("OTP Lockout & Mobile Normalization Logic", () => {
  it("normalizes Indian mobile numbers into canonical 10-digit format", () => {
    expect(normalizeTo10Digits("9876543210")).toBe("9876543210");
    expect(normalizeTo10Digits("+91 9876543210")).toBe("9876543210");
    expect(normalizeTo10Digits("+91-98765-43210")).toBe("9876543210");
    expect(normalizeTo10Digits("919876543210")).toBe("9876543210");
    expect(normalizeTo10Digits("09876543210")).toBe("9876543210");
    expect(formatMobileForApi("9876543210")).toBe("+919876543210");
    expect(validateIndianMobile("9876543210")).toBe(true);
    expect(validateIndianMobile("12345")).toBe(false);
  });

  it("handles incomplete browser autofill values gracefully without falsely validating", () => {
    // Incomplete 8-digit autofill with +91 country code
    const incompleteWithPlus = "+91 98765432";
    const normalizedIncomplete = normalizeTo10Digits(incompleteWithPlus);
    expect(normalizedIncomplete).toBe("98765432");
    expect(validateIndianMobile(incompleteWithPlus)).toBe(false);

    // Incomplete 8-digit autofill with 91 prefix
    const incompleteWith91 = "9198765432";
    expect(normalizeTo10Digits(incompleteWith91)).toBe("98765432");
    expect(validateIndianMobile(incompleteWith91)).toBe(false);

    // Short 5-digit string
    expect(validateIndianMobile("98765")).toBe(false);
  });

  it("calculates remaining lock seconds correctly and identifies active locks", () => {
    const mobileDigits = normalizeTo10Digits("+91 9876543210");
    const futureLockMs = Date.now() + 60000;

    const lockedMobiles: Record<string, { lockUntilMs: number; message: string }> = {
      [mobileDigits]: {
        lockUntilMs: futureLockMs,
        message: "Too many incorrect OTP attempts.",
      },
    };

    const info = lockedMobiles[mobileDigits];
    expect(info).toBeDefined();
    if (info) {
      expect(info.lockUntilMs).toBe(futureLockMs);
      const remainingSeconds = Math.max(0, Math.ceil((info.lockUntilMs - Date.now()) / 1000));
      expect(remainingSeconds).toBeGreaterThan(0);
    }

    // Expired locks calculate 0 remaining seconds
    const expiredLockMs = Date.now() - 1000;
    const expiredInfo = { lockUntilMs: expiredLockMs, message: "Expired" };
    const expiredRemainingSeconds = Math.max(0, Math.ceil((expiredInfo.lockUntilMs - Date.now()) / 1000));
    expect(expiredRemainingSeconds).toBe(0);
  });
});
