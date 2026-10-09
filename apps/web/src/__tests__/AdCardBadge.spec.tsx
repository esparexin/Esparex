import { describe, expect, it } from "vitest";
import { resolveListingTypeBadge, resolveListingTypeValue } from "@/lib/listings/listingPresentation";
import { ListingTypeBadge, shouldDisplayCategoryBadge, isSpotlightAd } from "@/components/user/ad-card/shared";
import { AdCardGrid } from "@/components/user/ad-card/AdCardGrid";
import { AdCardList } from "@/components/user/ad-card/AdCardList";

describe("ListingTypeBadge & Listing Type SSOT Resolution", () => {
  it("exports ListingTypeBadge, AdCardGrid, and AdCardList components", () => {
    expect(typeof ListingTypeBadge).toBe("function");
    expect(typeof AdCardGrid).toBe("object"); // memoized React component
    expect(typeof AdCardList).toBe("object"); // memoized React component
  });

  it("resolves General Device Ad badge correctly with canonical label 'Device'", () => {
    const badge = resolveListingTypeBadge({ listingType: "ad" });
    expect(badge).toEqual({
      type: "ad",
      label: "Device",
      icon: "device",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    });
  });

  it("resolves Repair Service badge correctly with canonical label 'Service'", () => {
    const badge = resolveListingTypeBadge({ listingType: "service" });
    expect(badge).toEqual({
      type: "service",
      label: "Service",
      icon: "wrench",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    });
  });

  it("resolves Hardware Spare Part badge correctly with canonical label 'Parts'", () => {
    const badge = resolveListingTypeBadge({ listingType: "spare_part" });
    expect(badge).toEqual({
      type: "spare_part",
      label: "Parts",
      icon: "cpu",
      className: "bg-purple-50 text-purple-700 border-purple-200",
    });
  });

  it("returns no badge for missing or undefined listingType (never defaults to Device)", () => {
    expect(resolveListingTypeValue(undefined)).toBeUndefined();
    expect(resolveListingTypeValue(null)).toBeUndefined();
    expect(resolveListingTypeValue({ listingType: undefined })).toBeUndefined();
    expect(resolveListingTypeValue({ listingType: "unknown_type" })).toBeUndefined();

    expect(resolveListingTypeBadge({})).toBeNull();
    expect(resolveListingTypeBadge(undefined)).toBeNull();
    expect(resolveListingTypeBadge({ listingType: "unknown_type" })).toBeNull();
  });

  describe("shouldDisplayCategoryBadge (Duplicate Badge Prevention)", () => {
    it("suppresses duplicate category badge when label matches service listing type", () => {
      const serviceAd = { id: "1", title: "Glass Repair", listingType: "service" } as any;
      expect(shouldDisplayCategoryBadge("Service", serviceAd)).toBe(false);
      expect(shouldDisplayCategoryBadge("Services", serviceAd)).toBe(false);
      expect(shouldDisplayCategoryBadge("service", serviceAd)).toBe(false);
      expect(shouldDisplayCategoryBadge("Repair Services", serviceAd)).toBe(false);
    });

    it("suppresses duplicate category badge when label matches spare parts listing type", () => {
      const partAd = { id: "2", title: "Display Panel", listingType: "spare_part" } as any;
      expect(shouldDisplayCategoryBadge("Parts", partAd)).toBe(false);
      expect(shouldDisplayCategoryBadge("Spare Part", partAd)).toBe(false);
      expect(shouldDisplayCategoryBadge("Spare Parts", partAd)).toBe(false);
      expect(shouldDisplayCategoryBadge("spare_part", partAd)).toBe(false);
    });

    it("suppresses generic fallbacks and empty category labels", () => {
      const adItem = { id: "3", title: "iPhone 13", listingType: "ad" } as any;
      expect(shouldDisplayCategoryBadge("General", adItem)).toBe(false);
      expect(shouldDisplayCategoryBadge("Category", adItem)).toBe(false);
      expect(shouldDisplayCategoryBadge("Device", adItem)).toBe(false);
      expect(shouldDisplayCategoryBadge("Devices", adItem)).toBe(false);
      expect(shouldDisplayCategoryBadge("Ad", adItem)).toBe(false);
      expect(shouldDisplayCategoryBadge("Ads", adItem)).toBe(false);
      expect(shouldDisplayCategoryBadge("", adItem)).toBe(false);
      expect(shouldDisplayCategoryBadge(null, adItem)).toBe(false);
      expect(shouldDisplayCategoryBadge(undefined, adItem)).toBe(false);
    });

    it("preserves distinct, non-duplicate subcategories", () => {
      const serviceAd = { id: "4", title: "Glass Repair", listingType: "service" } as any;
      expect(shouldDisplayCategoryBadge("Screen Replacement", serviceAd)).toBe(true);

      const deviceAd = { id: "5", title: "Pixel 7 Pro", listingType: "ad" } as any;
      expect(shouldDisplayCategoryBadge("Smartphones", deviceAd)).toBe(true);
    });
  });

  describe("isSpotlightAd (Spotlight Expiration SSOT)", () => {
    it("strictly evaluates to false when spotlightExpiresAt is in the past", () => {
      const expiredAd = {
        id: "exp-1",
        title: "iPhone 12",
        status: "live",
        isSpotlight: true,
        spotlightExpiresAt: new Date(Date.now() - 3600000).toISOString(),
      } as any;

      expect(isSpotlightAd(expiredAd)).toBe(false);
    });

    it("evaluates to true when spotlightExpiresAt is in the future", () => {
      const activeAd = {
        id: "act-1",
        title: "iPhone 13",
        status: "live",
        isSpotlight: true,
        spotlightExpiresAt: new Date(Date.now() + 3600000).toISOString(),
      } as any;

      expect(isSpotlightAd(activeAd)).toBe(true);
    });

    it("returns false for non-live listings even if spotlight is active", () => {
      const soldAd = {
        id: "sold-1",
        title: "Galaxy S22",
        status: "sold",
        isSpotlight: true,
        spotlightExpiresAt: new Date(Date.now() + 3600000).toISOString(),
      } as any;

      expect(isSpotlightAd(soldAd)).toBe(false);
    });
  });
});
