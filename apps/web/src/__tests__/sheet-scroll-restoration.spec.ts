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

    it("ensures AuthModal preserves the Sheet keyboard contract without fullscreen override", () => {
        const authModalPath = path.join(webSrc, "components", "auth", "AuthModal.tsx");
        const fileContent = fs.readFileSync(authModalPath, "utf-8");

        // Token-bound height bounds the modal container to the visual viewport above keyboard.
        expect(fileContent).toContain("h-[var(--visual-viewport-height,100svh)]");
        // Fullscreen override killed the primitive keyboard contract — must not return.
        expect(fileContent).not.toContain("fixed inset-0");
        expect(fileContent).not.toContain("h-full max-h-full");
        // Undocumented overlay masking + dead drag-era ref must stay removed.
        expect(fileContent).not.toContain("overlayClassName");
        expect(fileContent).not.toContain("contentRef");
        // Over-constrained CSS resolved: bottom-auto overrides primitive bottom anchor on mobile
        expect(fileContent).toContain("bottom-auto");
        // Double-keyboard compensation squish bug eliminated (container handles height; no inner padding duplicate)
        expect(fileContent).not.toContain("pb-[var(--keyboard-height");
        // Flex item properly enabled to shrink below min-content for overflow-y-auto scrolling
        expect(fileContent).toContain("min-h-0");
    });
});
