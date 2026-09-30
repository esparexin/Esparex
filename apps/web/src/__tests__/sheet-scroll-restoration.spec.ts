import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Sheet scroll-restoration regression suite.
 *
 * Root cause: a hand-rolled fixed-body scroll lock (lockSheetScroll) mounted in
 * the shared Sheet primitive duplicated Radix Dialog's built-in RemoveScroll
 * owner and leaked `body { position:fixed; overflow:hidden }`, freezing Home
 * (PageLayout default variant = natural document scroll) after Login popup use.
 * These tests pin the permanent fix: Radix owns scroll locking, Sheet stays a
 * pure wrapper, and AuthModal preserves the keyboard-aware Sheet contract.
 */
describe("Sheet Scroll Restoration Regression Suite", () => {
    const webSrc = path.resolve(__dirname, "..");
    const packagesUiSrc = path.resolve(__dirname, "../../../../packages/ui/src");

    it("ensures the custom fixed-body lock file stays deleted (Radix RemoveScroll is sole owner)", () => {
        const lockPath = path.join(packagesUiSrc, "feedback", "sheetScrollLock.ts");
        expect(fs.existsSync(lockPath)).toBe(false);
    });

    it("ensures SheetContent has no custom scroll-lock effect or body mutation", () => {
        const sheetPath = path.join(packagesUiSrc, "feedback", "Sheet.tsx");
        const fileContent = fs.readFileSync(sheetPath, "utf-8");

        expect(fileContent).not.toContain("lockSheetScroll");
        expect(fileContent).not.toContain("sheetScrollLock");
        expect(fileContent).not.toContain("body.style.position");
        expect(fileContent).not.toContain("overlayClassName");
    });

    it("ensures AuthModal maintains full-viewport surface on mobile with inner keyboard scroll containment", () => {
        const authModalPath = path.join(webSrc, "components", "auth", "AuthModal.tsx");
        const fileContent = fs.readFileSync(authModalPath, "utf-8");

        // Full-viewport opaque surface covers 100% of mobile screen preventing background bleed.
        expect(fileContent).toContain("top-0 bottom-0 left-0 right-0 h-full max-h-none");
        // Desktop retains centered max-w-sm card contract.
        expect(fileContent).toContain("sm:inset-0 sm:m-auto sm:w-full sm:max-w-sm");
        // Inner container dynamically compensates for keyboard height and safe-area.
        expect(fileContent).toContain("pb-[calc(var(--keyboard-height,0px)+max(1.5rem,env(safe-area-inset-bottom)))]");
        // Inner scroll container properly enabled to shrink below min-content with overscroll containment.
        expect(fileContent).toContain("flex-1 min-h-0 flex flex-col overflow-y-auto overscroll-contain");
        // Uses dedicated useNeutralizeWindowScroll hook to neutralize iOS WebKit window scroll drift.
        expect(fileContent).toContain("useNeutralizeWindowScroll(open)");
    });
});

