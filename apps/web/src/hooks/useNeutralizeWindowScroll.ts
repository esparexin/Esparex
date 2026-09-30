"use client";

import { useEffect } from "react";

/**
 * useNeutralizeWindowScroll
 * 
 * Neutralizes iOS WebKit native window auto-scroll drift while an overlay/modal is open.
 * On mobile Safari, WebKit forcibly shifts window.scrollY when form inputs are focused.
 * This hook holds window.scrollY at 0 during the modal lifecycle and restores the
 * user's original Home page scroll position cleanly upon close, without mutating
 * document.body.style.position.
 * 
 * Extracted from AuthModal to keep the component within ratchet line limits.
 */
export function useNeutralizeWindowScroll(open: boolean): void {
  useEffect(() => {
    if (!open || typeof window === "undefined") return undefined;

    const initialScrollY = window.scrollY;

    const neutralizeWindowScroll = () => {
      if (window.scrollY !== 0) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    };

    window.addEventListener("scroll", neutralizeWindowScroll, { passive: true });
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("scroll", neutralizeWindowScroll, { passive: true });
      vv.addEventListener("resize", neutralizeWindowScroll, { passive: true });
    }

    return () => {
      window.removeEventListener("scroll", neutralizeWindowScroll);
      if (vv) {
        vv.removeEventListener("scroll", neutralizeWindowScroll);
        vv.removeEventListener("resize", neutralizeWindowScroll);
      }
      if (initialScrollY !== 0) {
        window.scrollTo({ top: initialScrollY, left: 0, behavior: "instant" });
      }
    };
  }, [open]);
}
