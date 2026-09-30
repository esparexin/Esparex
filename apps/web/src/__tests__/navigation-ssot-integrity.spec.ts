import { describe, expect, it } from "vitest";
import { PROFILE_TAB_ITEMS, getNavigationItems, type ProfileTabValue } from "@/config/navigation";
import { resolveBottomNavActiveTab } from "@/components/user/MobileAccountBottomNav";

describe("Navigation SSOT Integrity & Responsive Parity", () => {
  it("maintains unique, non-empty tab values in PROFILE_TAB_ITEMS", () => {
    const values = PROFILE_TAB_ITEMS.map((item) => item.value);
    const uniqueValues = new Set(values);

    expect(values.length).toBeGreaterThan(0);
    expect(uniqueValues.size).toBe(values.length);
    values.forEach((val) => {
      expect(typeof val).toBe("string");
      expect(val.trim().length).toBeGreaterThan(0);
    });
  });

  it("ensures every tab item has a valid non-empty label and valid icon component", () => {
    PROFILE_TAB_ITEMS.forEach((item) => {
      expect(typeof item.label).toBe("string");
      expect(item.label.trim().length).toBeGreaterThan(0);
      expect(Boolean(item.icon && (typeof item.icon === "function" || typeof item.icon === "object"))).toBe(true);
    });
  });

  it("correctly resolves primary tabs in resolveBottomNavActiveTab", () => {
    const primaryTabs: ProfileTabValue[] = ["personal", "mylistings", "messages", "smartalerts"];
    primaryTabs.forEach((tab) => {
      expect(resolveBottomNavActiveTab(tab)).toBe(tab);
    });
  });

  it("maps secondary tabs to 'more' in resolveBottomNavActiveTab", () => {
    const secondaryTabs: ProfileTabValue[] = ["purchases", "plans", "wallet", "settings", "business", "services", "spare-parts"];
    secondaryTabs.forEach((tab) => {
      expect(resolveBottomNavActiveTab(tab)).toBe("more");
    });
  });

  it("guarantees all mobile drawer navigation items have valid href or page destinations", () => {
    const guestItems = getNavigationItems("mobile-drawer", { isLoggedIn: false, user: null });
    expect(guestItems.length).toBeGreaterThan(0);
    guestItems.forEach((item) => {
      const hasHref = typeof item.href === "string" && item.href.length > 0;
      const hasPage = typeof item.page === "string" && item.page.length > 0;
      expect(hasHref || hasPage).toBe(true);
    });

    const userItems = getNavigationItems("mobile-drawer", {
      isLoggedIn: true,
      user: { id: "u-1", name: "Test User", email: "test@esparex.in" } as any,
    });
    expect(userItems.length).toBeGreaterThan(0);
    userItems.forEach((item) => {
      const hasHref = typeof item.href === "string" && item.href.length > 0;
      const hasPage = typeof item.page === "string" && item.page.length > 0;
      expect(hasHref || hasPage).toBe(true);
    });
  });
});
