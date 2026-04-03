import { describe, expect, it } from "vitest";

import {
  normalizeAuthCallbackUrl,
  shouldUseLogoutRedirectBypass,
} from "@/lib/authHelpers";

describe("authHelpers", () => {
  it("only enables logout redirect bypass on guarded private routes", () => {
    expect(shouldUseLogoutRedirectBypass("/account")).toBe(true);
    expect(shouldUseLogoutRedirectBypass("/edit-service/123")).toBe(true);
    expect(shouldUseLogoutRedirectBypass("/post-spare-part-listing")).toBe(true);
    expect(shouldUseLogoutRedirectBypass("/")).toBe(false);
    expect(shouldUseLogoutRedirectBypass("/search")).toBe(false);
  });

  it("keeps callback URLs app-local", () => {
    expect(normalizeAuthCallbackUrl("/account?tab=settings")).toBe("/account?tab=settings");
    expect(normalizeAuthCallbackUrl("https://example.com")).toBe("/");
  });
});
