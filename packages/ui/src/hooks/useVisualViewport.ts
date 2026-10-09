"use client";

import { useEffect, useState } from "react";

/**
 * useVisualViewport: Synchronizes mobile visual viewport dimensions and offsetTop
 * into canonical CSS properties --visual-viewport-height and --visual-viewport-offset-top.
 */
export interface VisualViewportState {
  viewportHeight: number | null;
  viewportOffsetTop: number;
  keyboardHeight: number;
  isKeyboardOpen: boolean;
}

export function useVisualViewport(): VisualViewportState {
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [viewportOffsetTop, setViewportOffsetTop] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let rafId: number | null = null;
    let maxObservedHeight = typeof window !== "undefined" ? window.innerHeight : 0;

    const updateViewport = () => {
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        const vv = window.visualViewport;
        const currentHeight = vv ? vv.height : window.innerHeight;
        const layoutHeight = window.innerHeight;

        // Track maximum observed height to reliably detect keyboard across Android & iOS.
        if (layoutHeight > maxObservedHeight) maxObservedHeight = layoutHeight;

        const benchmarkHeight = Math.max(maxObservedHeight, layoutHeight);
        const keyboardActive = currentHeight < benchmarkHeight * 0.82;

        // On Android (where window.innerHeight shrank), the layout already sits above the keyboard,
        // so computedKeyboardHeight for CSS elevation must remain 0px to prevent double-elevation.
        // On iOS Safari (where layoutHeight did not shrink), computedKeyboardHeight elevates by the delta.
        const computedKeyboardHeight = keyboardActive
          ? Math.max(0, Math.round(layoutHeight - currentHeight))
          : 0;

        // On iOS Safari, focusing an input pans visualViewport downwards relative to layout coordinates.
        // Capturing offsetTop allows fixed dialogs and sheets to coordinate with WebKit's pan.
        const currentOffsetTop = keyboardActive && vv ? Math.max(0, Math.round(vv.offsetTop)) : 0;

        setViewportHeight(currentHeight);
        setViewportOffsetTop(currentOffsetTop);
        setKeyboardHeight(computedKeyboardHeight);
        setIsKeyboardOpen(keyboardActive);

        const root = document.documentElement;
        root.style.setProperty("--visual-viewport-height", `${Math.round(currentHeight)}px`);
        root.style.setProperty("--visual-viewport-offset-top", `${currentOffsetTop}px`);
        root.style.setProperty("--keyboard-height", `${computedKeyboardHeight}px`);
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

  return { viewportHeight, viewportOffsetTop, keyboardHeight, isKeyboardOpen };
}