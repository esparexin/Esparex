// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Location Popup Mobile Viewport & Focus Governance", () => {
  it("enforces safe focus and viewport padding invariants in LocationSelectorPanel", () => {
    const panelPath = path.resolve(__dirname, "../components/location/components/LocationSelectorPanel.tsx");
    const content = fs.readFileSync(panelPath, "utf-8");

    // 1. Must NOT have raw autoFocus on <Input> (prevents WebKit off-screen animation jump)
    expect(content).not.toMatch(/<Input[^>]*autoFocus/);

    // 2. Must assign id="location-selector-search-input" for controlled onOpenAutoFocus targeting
    expect(content).toContain('id="location-selector-search-input"');

    // 3. Must NOT have env(safe-area-inset-top) on bottom sheet header
    expect(content).not.toContain("env(safe-area-inset-top)");
  });

  it("enforces onOpenAutoFocus with preventScroll in LocationOverlayHost", () => {
    const hostPath = path.resolve(__dirname, "../components/location/LocationOverlayHost.tsx");
    const content = fs.readFileSync(hostPath, "utf-8");

    // 1. Must pass onOpenAutoFocus handler
    expect(content).toContain("onOpenAutoFocus");

    // 2. Must prevent default instant focus during slide animation
    expect(content).toContain("e.preventDefault()");

    // 3. Must focus with preventScroll: true
    expect(content).toContain("preventScroll: true");
  });
});
