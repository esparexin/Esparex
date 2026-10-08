import { describe, expect, it } from "vitest";
import {
  sanitizeRateLimitBaseMessage,
  appendRateLimitCountdown,
  formatSeconds,
} from "@/lib/otpHelpers";

describe("OTP Rate Limit Countdown SSOT Suite", () => {
  it("formats seconds to MM:SS correctly", () => {
    expect(formatSeconds(319)).toBe("05:19");
    expect(formatSeconds(308)).toBe("05:08");
    expect(formatSeconds(60)).toBe("01:00");
    expect(formatSeconds(5)).toBe("00:05");
    expect(formatSeconds(0)).toBe("00:00");
  });

  it("sanitizes pre-baked countdown strings from backend rate limiter", () => {
    expect(
      sanitizeRateLimitBaseMessage("Too many requests. Please try again in 05:19.")
    ).toBe("Too many requests");

    expect(
      sanitizeRateLimitBaseMessage("Too many requests. Try again in 05:19.")
    ).toBe("Too many requests");

    expect(
      sanitizeRateLimitBaseMessage("Too many requests. Please try again later.")
    ).toBe("Too many requests");

    expect(
      sanitizeRateLimitBaseMessage("Too many OTP requests")
    ).toBe("Too many OTP requests");

    expect(
      sanitizeRateLimitBaseMessage("Account is temporarily locked. Please try again in 15:00.")
    ).toBe("Account is temporarily locked");
  });

  it("produces exactly one countdown when backend pre-formats and frontend adds live time", () => {
    const backendMessage = "Too many requests. Please try again in 05:19.";
    const liveRemainingSeconds = 308; // 05:08

    const formatted = appendRateLimitCountdown(
      backendMessage,
      true,
      liveRemainingSeconds
    );

    // MUST NOT produce duplicate countdowns like "05:19 ... 05:08"
    expect(formatted).toBe("Too many requests. Please try again in 05:08.");
    expect(formatted).not.toContain("05:19");
  });

  it("handles un-rate-limited and zero-second states cleanly", () => {
    expect(
      appendRateLimitCountdown("Too many requests. Please try again in 05:19.", false, 308)
    ).toBe("Too many requests. Please try again in 05:19.");

    expect(
      appendRateLimitCountdown("Too many requests. Please try again in 05:19.", true, 0)
    ).toBe("Too many requests.");
  });
});
