import { describe, expect, it } from "vitest";

describe("Login Step Auto-Focus Target Logic", () => {
  function getAutoFocusTarget(step: "enterMobile" | "enterNameAndOtp" | "enterOtp" | "locked") {
    switch (step) {
      case "enterMobile":
        return { type: "field", target: "mobile" };
      case "enterNameAndOtp":
        return { type: "field", target: "name" };
      case "enterOtp":
        return { type: "elementId", target: "otp-digit-1" };
      default:
        return null;
    }
  }

  it("targets mobile input on enterMobile step", () => {
    const result = getAutoFocusTarget("enterMobile");
    expect(result).toEqual({ type: "field", target: "mobile" });
  });

  it("targets name input on enterNameAndOtp step for new users", () => {
    const result = getAutoFocusTarget("enterNameAndOtp");
    expect(result).toEqual({ type: "field", target: "name" });
  });

  it("targets first OTP digit box (otp-digit-1) on enterOtp step for existing users", () => {
    const result = getAutoFocusTarget("enterOtp");
    expect(result).toEqual({ type: "elementId", target: "otp-digit-1" });
  });

  it("returns null for locked state", () => {
    const result = getAutoFocusTarget("locked");
    expect(result).toBeNull();
  });
});
