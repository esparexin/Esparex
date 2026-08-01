import { describe, expect, it } from "vitest";
import { BrowseAds } from "@/components/user/BrowseAds";
import { useBrowseAdsData } from "@/components/user/useBrowseAdsData";
import { useBrowseFilterPipeline } from "@/components/user/useBrowseFilterPipeline";
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
});
