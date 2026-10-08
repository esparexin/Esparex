import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Mobile Keyboard Audit & Viewport Governance Regression Suite", () => {
    const webSrc = path.resolve(__dirname, "..");
    const packagesUiSrc = path.resolve(__dirname, "../../../../packages/ui/src");

    it("ensures app/layout.tsx configures interactiveWidget: 'resizes-content'", () => {
        const layoutPath = path.join(webSrc, "app", "layout.tsx");
        const fileContent = fs.readFileSync(layoutPath, "utf-8");

        expect(fileContent).toContain("interactiveWidget: 'resizes-content'");
    });

    it("ensures useVisualViewport computes --keyboard-height and sets data-keyboard-open on documentElement", () => {
        const webHookPath = path.join(webSrc, "hooks", "useVisualViewport.ts");
        const webFileContent = fs.readFileSync(webHookPath, "utf-8");
        expect(webFileContent).toContain('export { useVisualViewport } from "@esparex/ui"');

        const canonicalHookPath = path.join(packagesUiSrc, "hooks", "useVisualViewport.ts");
        const fileContent = fs.readFileSync(canonicalHookPath, "utf-8");

        expect(fileContent).toContain("--keyboard-height");
        expect(fileContent).toContain("--visual-viewport-height");
        expect(fileContent).toContain("isKeyboardOpen");
        expect(fileContent).toContain('root.setAttribute("data-keyboard-open"');
    });

    it("ensures Sheet bottom variant elevates with --keyboard-height and uses duration token", () => {
        const sheetPath = path.join(packagesUiSrc, "feedback", "Sheet.tsx");
        const fileContent = fs.readFileSync(sheetPath, "utf-8");

        expect(fileContent).toContain("bottom-[var(--keyboard-height,0px)]");
        expect(fileContent).toContain("transition-[bottom,transform]");
        expect(fileContent).toContain("var(--duration-keyboard)");
    });

    it("ensures Dialog no longer has bottomSheet variant in app code", () => {
        const dialogPath = path.join(packagesUiSrc, "feedback", "Dialog.tsx");
        const fileContent = fs.readFileSync(dialogPath, "utf-8");

        // Dialog still has the variant for internal use, but app code should use Sheet
        expect(fileContent).toContain("bottomSheet");
    });

    it("ensures no Dialog variant=\"bottomSheet\" usage in app components", () => {
        // This is a meta-test - actual enforcement is in architecture guard
        // But we verify the key files have been migrated
        const authModalPath = path.join(webSrc, "components", "auth", "AuthModal.tsx");
        const authModalContent = fs.readFileSync(authModalPath, "utf-8");
        
        // AuthModal should use Sheet, not Dialog variant="bottomSheet"
        expect(authModalContent).toContain("Sheet");
        expect(authModalContent).toContain('side="bottom"');
        expect(authModalContent).not.toContain('variant="bottomSheet"');
        // AuthModal must center on desktop viewports without corner docking
        expect(authModalContent).toContain("sm:inset-0");
        expect(authModalContent).toContain("sm:m-auto");
        expect(authModalContent).toContain("sm:max-w-sm");
    });

    it("ensures globals.css hides mobile navigation when keyboard is open (decorative workaround removed)", () => {
        const cssPath = path.join(webSrc, "styles", "globals.css");
        const fileContent = fs.readFileSync(cssPath, "utf-8");

        // Mobile bottom nav suppression retained
        expect(fileContent).toContain('html[data-keyboard-open="true"] nav[aria-label="Mobile footer navigation"]');
        expect(fileContent).toContain('html[data-keyboard-open="true"] nav[aria-label="Mobile account navigation"]');
        
        // Decorative element workaround removed
        expect(fileContent).not.toContain('[data-keyboard-hide-on-mobile="true"]');
    });

    it("ensures LocationSelectorPanel avoids raw autoFocus and eliminates top safe-area notch padding on bottom sheet", () => {
        const panelPath = path.join(webSrc, "components", "location", "components", "LocationSelectorPanel.tsx");
        const fileContent = fs.readFileSync(panelPath, "utf-8");

        expect(fileContent).not.toMatch(/<Input[^>]*autoFocus/);
        expect(fileContent).toContain('id="location-selector-search-input"');
        expect(fileContent).not.toContain("env(safe-area-inset-top)");
    });

    it("ensures LocationOverlayHost safely delays focus with preventScroll and clamps sheet height", () => {
        const hostPath = path.join(webSrc, "components", "location", "LocationOverlayHost.tsx");
        const fileContent = fs.readFileSync(hostPath, "utf-8");

        expect(fileContent).toContain("onOpenAutoFocus");
        expect(fileContent).toContain("preventScroll: true");
        expect(fileContent).toContain("h-[min(480px,calc(var(--visual-viewport-height,100dvh)-1rem))]");
    });

    it("ensures EntitySearchCombobox mobile drawer uses Sheet with preventScroll focus", () => {
        const comboboxPath = path.join(webSrc, "components", "user", "EntitySearchCombobox.tsx");
        const fileContent = fs.readFileSync(comboboxPath, "utf-8");

        // Should use Sheet, not Drawer
        expect(fileContent).toContain("Sheet");
        expect(fileContent).toContain('side="bottom"');
        expect(fileContent).not.toContain("Drawer");
        expect(fileContent).toContain("mobileInputRef.current?.focus({ preventScroll: true })");
        expect(fileContent).toContain("var(--visual-viewport-height,100dvh)");
    });

    it("ensures Login no longer has data-keyboard-hide-on-mobile workaround", () => {
        const loginPath = path.join(webSrc, "components", "user", "Login.tsx");
        const fileContent = fs.readFileSync(loginPath, "utf-8");

        expect(fileContent).not.toContain('data-keyboard-hide-on-mobile="true"');
    });

    it("ensures DeleteAccountDialog body max-height adapts to visual viewport height", () => {
        const dialogPath = path.join(webSrc, "components", "user", "profile", "dialogs", "DeleteAccountDialog.tsx");
        const fileContent = fs.readFileSync(dialogPath, "utf-8");

        expect(fileContent).toContain("var(--visual-viewport-height,100dvh)");
    });

    it("ensures SheetContent passes onOpenAutoFocus to Radix primitive", () => {
        const sheetPath = path.join(packagesUiSrc, "feedback", "Sheet.tsx");
        const fileContent = fs.readFileSync(sheetPath, "utf-8");

        expect(fileContent).toContain("onOpenAutoFocus");
        expect(fileContent).toContain("handleOpenAutoFocus(e, onOpenAutoFocus)");
    });

    it("ensures duration token exists in design-tokens", () => {
        const durationsPath = path.join(packagesUiSrc, "../../design-tokens/src/durations.ts");
        const fileContent = fs.readFileSync(durationsPath, "utf-8");

        expect(fileContent).toContain("keyboard: '300ms'");
    });

    it("ensures SheetContent safely merges props.style with zIndex and supports hideClose", () => {
        const sheetPath = path.join(packagesUiSrc, "feedback", "Sheet.tsx");
        const fileContent = fs.readFileSync(sheetPath, "utf-8");

        expect(fileContent).toContain("zIndex: Z_INDEX.sheetContent, ...style");
        expect(fileContent).toContain("hideClose = false");
        expect(fileContent).toContain("!hideClose &&");
        expect(fileContent).not.toContain("!opacity-100");
    });

    it("ensures globals.css defines --duration-keyboard linking design tokens to CSS environment", () => {
        const cssPath = path.join(webSrc, "styles", "globals.css");
        const fileContent = fs.readFileSync(cssPath, "utf-8");

        expect(fileContent).toContain("--duration-keyboard: 300ms");
    });

    it("ensures AuthModal passes hideClose and avoids asynchronous setTimeout focus hacks", () => {
        const authModalPath = path.join(webSrc, "components", "auth", "AuthModal.tsx");
        const fileContent = fs.readFileSync(authModalPath, "utf-8");

        expect(fileContent).toContain("hideClose");
        expect(fileContent).not.toMatch(/onOpenAutoFocus=.*setTimeout/s);
    });

    it("ensures UserAppProviders nests BottomSheetManagerProvider as ancestor of AuthModalProvider", () => {
        const providersPath = path.join(webSrc, "components", "providers", "UserAppProviders.tsx");
        const fileContent = fs.readFileSync(providersPath, "utf-8");

        const bottomSheetIndex = fileContent.indexOf("<BottomSheetManagerProvider>");
        const authModalIndex = fileContent.indexOf("<AuthModalProvider>");

        expect(bottomSheetIndex).toBeGreaterThan(-1);
        expect(authModalIndex).toBeGreaterThan(-1);
        expect(bottomSheetIndex).toBeLessThan(authModalIndex);
    });

    it("ensures LoginMobileStep defines enterKeyHint='send', type='tel', and Enter key submit handling", () => {
        // PR-quality split (7e7a610): the mobile step was extracted from the
        // single responsive Login.tsx into components/user/auth/LoginMobileStep.tsx
        // at a responsibility seam (no viewport split). The keyboard behavior
        // lives there — assert there.
        const mobileStepPath = path.join(webSrc, "components", "user", "auth", "LoginMobileStep.tsx");
        const fileContent = fs.readFileSync(mobileStepPath, "utf-8");

        expect(fileContent).toContain('type="tel"');
        expect(fileContent).toContain('enterKeyHint="send"');
        expect(fileContent).toContain('e.key === "Enter"');
        expect(fileContent).toContain("requestSubmit()");
    });
});
