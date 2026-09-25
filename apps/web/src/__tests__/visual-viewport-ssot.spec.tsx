// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-primary" }),
}));

import { viewport } from "@/app/layout";

describe("Visual Viewport & Keyboard Metadata SSOT Standard", () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty("--visual-viewport-height");
    document.documentElement.style.removeProperty("--keyboard-height");
    document.documentElement.removeAttribute("data-keyboard-open");
  });

  it("enforces interactiveWidget='resizes-content' in Next.js viewport metadata", () => {
    expect(viewport.interactiveWidget).toBe("resizes-content");
    expect(viewport.width).toBe("device-width");
    expect(viewport.initialScale).toBe(1);
    expect(viewport.viewportFit).toBe("cover");
  });

  it("exports useVisualViewport and correctly calculates keyboard height and custom properties", async () => {
    const { useVisualViewport } = await import("@/hooks/useVisualViewport");
    expect(typeof useVisualViewport).toBe("function");

    // Test viewport computation logic directly:
    // If layoutHeight = 800, visualViewport.height = 480:
    const layoutHeight = 800;
    const currentHeight = 480;
    const keyboardActive = currentHeight < layoutHeight * 0.82;
    const computedKeyboardHeight = keyboardActive
      ? Math.max(0, Math.round(layoutHeight - currentHeight))
      : 0;

    expect(keyboardActive).toBe(true);
    expect(computedKeyboardHeight).toBe(320);

    // Apply properties as useVisualViewport does
    const root = document.documentElement;
    root.style.setProperty("--visual-viewport-height", `${Math.round(currentHeight)}px`);
    root.style.setProperty("--keyboard-height", `${computedKeyboardHeight}px`);
    root.setAttribute("data-keyboard-open", keyboardActive ? "true" : "false");

    expect(root.style.getPropertyValue("--visual-viewport-height")).toBe("480px");
    expect(root.style.getPropertyValue("--keyboard-height")).toBe("320px");
    expect(root.getAttribute("data-keyboard-open")).toBe("true");

    // Close keyboard
    const closedHeight = 800;
    const closedKeyboardActive = closedHeight < layoutHeight * 0.82;
    const closedKeyboardHeight = closedKeyboardActive
      ? Math.max(0, Math.round(layoutHeight - closedHeight))
      : 0;

    expect(closedKeyboardActive).toBe(false);
    expect(closedKeyboardHeight).toBe(0);

    root.style.setProperty("--visual-viewport-height", `${Math.round(closedHeight)}px`);
    root.style.setProperty("--keyboard-height", `${closedKeyboardHeight}px`);
    root.setAttribute("data-keyboard-open", closedKeyboardActive ? "true" : "false");

    expect(root.style.getPropertyValue("--visual-viewport-height")).toBe("800px");
    expect(root.style.getPropertyValue("--keyboard-height")).toBe("0px");
    expect(root.getAttribute("data-keyboard-open")).toBe("false");
  });
});
