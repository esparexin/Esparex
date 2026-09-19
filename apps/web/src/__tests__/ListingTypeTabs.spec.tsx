import { describe, expect, it } from "vitest";
import { ListingTypeTabs, LISTING_TYPE_TABS } from "@/components/user/ListingTypeTabs";

describe("ListingTypeTabs SSOT & Accessibility Specifications", () => {
  it("exports ListingTypeTabs component as a function", () => {
    expect(typeof ListingTypeTabs).toBe("function");
  });

  it("defines exactly 4 canonical listing type tabs in correct order", () => {
    expect(LISTING_TYPE_TABS).toHaveLength(4);
    expect(LISTING_TYPE_TABS.map((t) => t.id)).toEqual([
      "all",
      "ad",
      "service",
      "spare_part",
    ]);
  });

  it("defines clear, concise labels for all tabs without verbose phrases", () => {
    const labels = LISTING_TYPE_TABS.map((t) => t.label);
    expect(labels).toEqual(["All Listings", "Devices", "Services", "Spare Parts"]);

    // Ensure verbose legacy phrases are avoided
    expect(labels).not.toContain("General Devices");
    expect(labels).not.toContain("Repair Services");
    expect(labels).not.toContain("Hardware Spare Parts");
  });

  it("provides accessible aria-labels for screen readers on every tab", () => {
    LISTING_TYPE_TABS.forEach((tab) => {
      expect(tab.ariaLabel).toBeTruthy();
      expect(tab.ariaLabel.toLowerCase()).toContain("filter");
    });
  });

  it("assigns distinct micro-icons to each listing type", () => {
    const icons = LISTING_TYPE_TABS.map((t) => t.icon);
    const uniqueIcons = new Set(icons);
    expect(uniqueIcons.size).toBe(4);
  });
});
