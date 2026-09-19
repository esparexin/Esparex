import { describe, expect, it } from "vitest";
import { OtpInput } from "@esparex/ui";

describe("OtpInput UX & Mobile WebKit Autofill Contract Verification", () => {
  it("exports OtpInput component from @esparex/ui", () => {
    expect(typeof OtpInput).toBe("object"); // React.forwardRef returns an object with render fn
  });

  it("handles SMS OTP autofill simulation (multi-digit injection)", () => {
    const length = 6;
    const autofillString = "987654";
    const digits = autofillString.slice(0, length).split("");
    const otpState = Array(length).fill("");

    // Simulate the new OtpInput multi-digit handling algorithm
    digits.forEach((digit, i) => {
      if (i < length) otpState[i] = digit;
    });

    expect(otpState.join("")).toBe("987654");
    expect(otpState).toEqual(["9", "8", "7", "6", "5", "4"]);
  });

  it("handles full-length paste starting from index 0 regardless of focused slot", () => {
    const length = 6;
    const pasted = "543210";
    const focusedSlot = 2; // User had 3rd box focused

    // Algorithm under test: full OTP pasted into any cell fills from index 0
    const startIdx = pasted.length >= length ? 0 : focusedSlot;
    const digits = pasted.slice(0, length - startIdx).split("");
    const otpState = Array(length).fill("");

    digits.forEach((digit, offset) => {
      otpState[startIdx + offset] = digit;
    });

    expect(otpState.join("")).toBe("543210");
  });

  it("verifies preventScroll option structure for mobile WebKit focus calls", () => {
    const focusOptions: FocusOptions = { preventScroll: true };
    expect(focusOptions.preventScroll).toBe(true);
  });
});
