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
export function useVisualViewport() {
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
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

        setViewportHeight(currentHeight);
        setIsKeyboardOpen(keyboardActive);

        const root = document.documentElement;
        root.style.setProperty("--visual-viewport-height", `${Math.round(currentHeight)}px`);
        root.setAttribute("data-keyboard-open", keyboardActive ? "true" : "false");
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

  return { viewportHeight, isKeyboardOpen };
}
