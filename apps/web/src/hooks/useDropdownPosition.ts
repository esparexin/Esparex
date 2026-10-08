"use client";

import { useState, useEffect } from "react";

/**
 * useDropdownPosition — tracks the viewport-relative position of an anchor
 * element for portalled dropdowns. Returns a fixed-position rect updated on
 * scroll/resize, or null when the dropdown is closed.
 *
 * Extracted from EntitySearchCombobox (F-Z7 portal fix) — the positioning
 * logic is a cohesive unit independent of the combobox's search/selection.
 */
export interface DropdownRect {
  top: number;
  left: number;
  width: number;
}

export function useDropdownPosition(
  anchorRef: React.RefObject<HTMLElement | null>,
  isOpen: boolean,
  offsetY = 6
): DropdownRect | null {
  const [rect, setRect] = useState<DropdownRect | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.bottom + offsetY, left: r.left, width: r.width });
    };
    update();
    window.addEventListener("scroll", update, { capture: true, passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, { capture: true });
      window.removeEventListener("resize", update);
    };
  }, [isOpen, anchorRef, offsetY]);

  return isOpen ? rect : null;
}