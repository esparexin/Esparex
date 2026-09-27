"use client";

import { useEffect, useState } from "react";

/**
 * useVisualViewport
 * 
 * Synchronizes the mobile visual viewport height (`window.visualViewport.height`)
 * into a canonical CSS custom property `--visual-viewport-height` on `<html>`.
 * 
 * This enables fixed/sticky dialogs, drawers, and sheets on iOS Safari and
 * Android Chrome to accurately bound their max-height and positioning above
 * the on-screen virtual keyboard without manual calculation or layout jitter.
 */
export interface VisualViewportState {
  viewportHeight: number | null;
  keyboardHeight: number;
  isKeyboardOpen: boolean;
}

export function useVisualViewport(): VisualViewportState {
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let rafId: number | null = null;

    const updateViewport = () => {
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        const vv = window.visualViewport;
        const currentHeight = vv ? vv.height : window.innerHeight;
        const layoutHeight = window.innerHeight;

        // Detect if software keyboard is active (typically shrinks visual viewport by >18%)
        const keyboardActive = currentHeight < layoutHeight * 0.82;
        const computedKeyboardHeight = keyboardActive
          ? Math.max(0, Math.round(layoutHeight - currentHeight))
          : 0;

        setViewportHeight(currentHeight);
        setKeyboardHeight(computedKeyboardHeight);
        setIsKeyboardOpen(keyboardActive);

        const root = document.documentElement;
        root.style.setProperty("--visual-viewport-height", `${Math.round(currentHeight)}px`);
        root.style.setProperty("--keyboard-height", `${computedKeyboardHeight}px`);
        root.setAttribute("data-keyboard-open", keyboardActive ? "true" : "false");

        // When the keyboard dismisses on iOS, reset any residual window scroll that WebKit created
        if (!keyboardActive && window.scrollY !== 0) {
          const hasOpenOverlay = document.querySelector(
            '[data-slot="dialog-content"], [data-slot="sheet-content"], [data-slot="sheet-overlay"], [data-state="open"][role="dialog"]'
          );
          if (hasOpenOverlay) {
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          }
        }
      });
    };

    updateViewport();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", updateViewport);
      vv.addEventListener("scroll", updateViewport);
    }
    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", updateViewport);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (vv) {
        vv.removeEventListener("resize", updateViewport);
        vv.removeEventListener("scroll", updateViewport);
      }
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
    };
  }, []);

  return { viewportHeight, keyboardHeight, isKeyboardOpen };
}
