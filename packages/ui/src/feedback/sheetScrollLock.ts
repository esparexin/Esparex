"use client";

let activeSheetLockCount = 0;
let preservedSheetScrollY = 0;

/**
 * lockSheetScroll
 * 
 * Implements a ref-counted fixed-body scroll lock when a Sheet/modal is open.
 * On mobile WebKit (iOS Safari), overflow: hidden on body alone does not prevent
 * window.scrollY from scrolling during virtual keyboard input focus.
 * Pinned fixed-body locking freezes the document scrollHeight to 100% of innerHeight,
 * eliminating the layout viewport shift and background bleed permanently.
 */
export function lockSheetScroll(): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  activeSheetLockCount++;
  if (activeSheetLockCount === 1) {
    preservedSheetScrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;

    body.dataset.sheetPrevPosition = body.style.position;
    body.dataset.sheetPrevTop = body.style.top;
    body.dataset.sheetPrevWidth = body.style.width;
    body.dataset.sheetPrevHeight = body.style.height;
    body.dataset.sheetPrevOverflow = body.style.overflow;
    html.dataset.sheetPrevOverflow = html.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${preservedSheetScrollY}px`;
    body.style.width = "100%";
    body.style.height = "100%";
  }

  return () => {
    activeSheetLockCount = Math.max(0, activeSheetLockCount - 1);
    if (activeSheetLockCount === 0) {
      const body = document.body;
      const html = document.documentElement;

      html.style.overflow = html.dataset.sheetPrevOverflow ?? "";
      body.style.overflow = body.dataset.sheetPrevOverflow ?? "";
      body.style.position = body.dataset.sheetPrevPosition ?? "";
      body.style.top = body.dataset.sheetPrevTop ?? "";
      body.style.width = body.dataset.sheetPrevWidth ?? "";
      body.style.height = body.dataset.sheetPrevHeight ?? "";

      delete body.dataset.sheetPrevPosition;
      delete body.dataset.sheetPrevTop;
      delete body.dataset.sheetPrevWidth;
      delete body.dataset.sheetPrevHeight;
      delete body.dataset.sheetPrevOverflow;
      delete html.dataset.sheetPrevOverflow;

      window.scrollTo({ top: preservedSheetScrollY, left: 0, behavior: "instant" });
    }
  };
}
