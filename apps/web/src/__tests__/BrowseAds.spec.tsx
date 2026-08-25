import { describe, expect, it } from "vitest";
import { BrowseAds } from "@/components/user/BrowseAds";
import { useBrowseAdsData } from "@/components/user/useBrowseAdsData";
import { useBrowseFilterPipeline, computeActiveFilterBadges } from "@/components/user/useBrowseFilterPipeline";
import { BrowseGridSkeleton } from "@/components/user/BrowseGridSkeleton";

describe("BrowseAds Architectural SSOT Components", () => {
  it("exports BrowseAds entry component function", () => {
    expect(typeof BrowseAds).toBe("function");
  });

  it("exports useBrowseAdsData data orchestration hook", () => {
    expect(typeof useBrowseAdsData).toBe("function");
  });

  it("exports useBrowseFilterPipeline filter hook", () => {
    expect(typeof useBrowseFilterPipeline).toBe("function");
  });

  it("exports BrowseGridSkeleton layout skeleton component", () => {
    expect(typeof BrowseGridSkeleton).toBe("function");
  });

  it("calculates activeFilterCount correctly without counting sort dropdown", () => {
    const badges = computeActiveFilterBadges({
      query: "",
      minPrice: 5000,
      maxPrice: 20000,
      deviceCondition: "power_on",
    });

    expect(badges.length).toBe(2);
    expect(badges).toContain("Price: ₹5000 - ₹20000");
    expect(badges).toContain("Working (Powers On)");
    expect(badges.some((b) => b.startsWith("Sort:"))).toBe(false);
  });
});
