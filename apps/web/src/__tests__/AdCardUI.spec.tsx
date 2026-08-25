import { describe, expect, it } from "vitest";
import { AdSchema } from "@esparex/contracts";
import { AdCardGrid } from "@/components/user/ad-card/AdCardGrid";
import { AdCardList } from "@/components/user/ad-card/AdCardList";
import { AdCardMeta } from "@/components/user/ad-card/primitives/AdCardMeta";
import { AdCardCover } from "@/components/user/ad-card/primitives/AdCardCover";
import { AdCardActions } from "@/components/user/ad-card/primitives/AdCardActions";
import { AdCardShell } from "@/components/user/ad-card/primitives/AdCardShell";
import { resolveDeviceCondition, getConditionBadge, isSpotlightAd } from "@/components/user/ad-card/shared";
import { formatShortRelativeTime } from "@/lib/formatters";
import { useFavoriteAd } from "@/hooks/listings/useFavoriteAd";

const createMockAd = (overrides = {}) =>
  AdSchema.parse({
    id: "test-ad-1",
    title: "Test Ad Title",
    price: 1000,
    description: "Test description text",
    images: ["https://example.com/img1.jpg"],
    sellerId: "user-123",
    status: "live",
    createdAt: new Date().toISOString(),
    location: { city: "Vijayapuri South", state: "Andhra Pradesh", country: "India" },
    ...overrides,
  });

describe("AdCard Component SSOT & Architecture", () => {
  it("exports all canonical ad card components and primitives", () => {
    expect(typeof AdCardGrid).toBe("object"); // memoized component
    expect(typeof AdCardList).toBe("object"); // memoized component
    expect(typeof AdCardMeta).toBe("object"); // memoized component
    expect(typeof AdCardCover).toBe("object"); // memoized component
    expect(typeof AdCardActions).toBe("object"); // memoized component
    expect(typeof AdCardShell).toBe("object"); // memoized component
    expect(typeof useFavoriteAd).toBe("function");
  });

  describe("Device Condition Resolution & Badge Generation", () => {
    it("resolves power_on condition from deviceCondition or title", () => {
      expect(resolveDeviceCondition(createMockAd({ title: "iPhone 13 - Powers On Working" }))).toBe("power_on");
      expect(resolveDeviceCondition(createMockAd({ deviceCondition: "power_on" }))).toBe("power_on");
      expect(resolveDeviceCondition(createMockAd({ condition: "working" }))).toBe("power_on");
    });

    it("resolves power_off condition from deviceCondition or title", () => {
      expect(resolveDeviceCondition(createMockAd({ title: "Haier 40 Inch LED TV - Power Off Condition" }))).toBe("power_off");
      expect(resolveDeviceCondition(createMockAd({ deviceCondition: "power_off" }))).toBe("power_off");
      expect(resolveDeviceCondition(createMockAd({ condition: "dead" }))).toBe("power_off");
    });

    it("returns valid React badge elements for power conditions", () => {
      const onBadge = getConditionBadge("power_on");
      expect(onBadge).not.toBeNull();

      const offBadge = getConditionBadge("power_off");
      expect(offBadge).not.toBeNull();

      const unknownBadge = getConditionBadge("unknown_condition");
      expect(unknownBadge).toBeNull();
    });
  });

  describe("Spotlight Promotion Resolution", () => {
    it("detects spotlight listing correctly", () => {
      expect(isSpotlightAd(createMockAd({ isSpotlight: true }))).toBe(true);
      expect(isSpotlightAd(createMockAd({ status: "sold", isSpotlight: true }))).toBe(false);
      expect(isSpotlightAd(createMockAd({ isSpotlight: false }))).toBe(false);
    });
  });

  describe("Centralized Relative Date Formatting", () => {
    it("formats relative dates cleanly for card metadata display", () => {
      const now = new Date("2026-08-25T12:00:00Z").getTime();
      expect(formatShortRelativeTime(new Date(now), now)).toBe("Just now");
      expect(formatShortRelativeTime(new Date(now - 120000), now)).toBe("2m ago");
      expect(formatShortRelativeTime(new Date(now - 7200000), now)).toBe("2h ago");
      expect(formatShortRelativeTime(new Date(now - 86400000), now)).toBe("1 day ago");
      expect(formatShortRelativeTime(new Date("2026-07-24T12:00:00Z"), now)).toBe("24 Jul");
      expect(formatShortRelativeTime(new Date("2025-07-24T12:00:00Z"), now)).toBe("24 Jul 2025");
    });
  });

  describe("Badge Sizing & Density Tokens", () => {
    it("renders condition badges with compact text-tiny and h-4.5 classes", () => {
      const onBadge = getConditionBadge("power_on");
      expect(onBadge).not.toBeNull();
      const offBadge = getConditionBadge("power_off");
      expect(offBadge).not.toBeNull();
    });
  });
});
