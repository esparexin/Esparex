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
        const hookPath = path.join(webSrc, "hooks", "useVisualViewport.ts");
        const fileContent = fs.readFileSync(hookPath, "utf-8");

        expect(fileContent).toContain("--keyboard-height");
        expect(fileContent).toContain("--visual-viewport-height");
        expect(fileContent).toContain("isKeyboardOpen");
        expect(fileContent).toContain('root.setAttribute("data-keyboard-open"');
    });

    it("ensures Sheet bottom variant elevates with --keyboard-height", () => {
        const sheetPath = path.join(packagesUiSrc, "feedback", "Sheet.tsx");
        const fileContent = fs.readFileSync(sheetPath, "utf-8");

        expect(fileContent).toContain("bottom-[var(--keyboard-height,0px)]");
        expect(fileContent).toContain("transition-[bottom,transform]");
    });

    it("ensures Dialog bottomSheet variant elevates with --keyboard-height", () => {
        const dialogPath = path.join(packagesUiSrc, "feedback", "Dialog.tsx");
        const fileContent = fs.readFileSync(dialogPath, "utf-8");

        expect(fileContent).toContain("bottom-[var(--keyboard-height,0px)]");
        expect(fileContent).toContain("transition-[bottom]");
    });

    it("ensures Drawer elevates with --keyboard-height and bounds to visual viewport", () => {
        const drawerPath = path.join(packagesUiSrc, "feedback", "Drawer.tsx");
        const fileContent = fs.readFileSync(drawerPath, "utf-8");

        expect(fileContent).toContain("bottom-[var(--keyboard-height,0px)]");
        expect(fileContent).toContain("max-h-[min(96%,calc(var(--visual-viewport-height,100dvh)-1rem))]");
    });

    it("ensures globals.css hides mobile navigation and compacts decorative elements when keyboard is open", () => {
        const cssPath = path.join(webSrc, "styles", "globals.css");
        const fileContent = fs.readFileSync(cssPath, "utf-8");

        expect(fileContent).toContain('html[data-keyboard-open="true"] nav[aria-label="Mobile footer navigation"]');
        expect(fileContent).toContain('html[data-keyboard-open="true"] nav[aria-label="Mobile account navigation"]');
        expect(fileContent).toContain('html[data-keyboard-open="true"] [data-keyboard-hide-on-mobile="true"]');
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

    it("ensures EntitySearchCombobox mobile drawer avoids raw autoFocus and bounds height to visual viewport", () => {
        const comboboxPath = path.join(webSrc, "components", "user", "EntitySearchCombobox.tsx");
        const fileContent = fs.readFileSync(comboboxPath, "utf-8");

        const mobileDrawerSection = fileContent.slice(fileContent.indexOf("<Drawer title={title}"));
        expect(mobileDrawerSection).not.toMatch(/<Input[^>]*autoFocus/);
        expect(fileContent).toContain("mobileInputRef.current?.focus({ preventScroll: true })");
        expect(fileContent).toContain("var(--visual-viewport-height,100dvh)");
    });

    it("ensures Login decorative logo is marked to hide when keyboard is active on small mobile viewports", () => {
        const loginPath = path.join(webSrc, "components", "user", "Login.tsx");
        const fileContent = fs.readFileSync(loginPath, "utf-8");

        expect(fileContent).toContain('data-keyboard-hide-on-mobile="true"');
    });

    it("ensures DeleteAccountDialog body max-height adapts to visual viewport height", () => {
        const dialogPath = path.join(webSrc, "components", "user", "profile", "dialogs", "DeleteAccountDialog.tsx");
        const fileContent = fs.readFileSync(dialogPath, "utf-8");

        expect(fileContent).toContain("var(--visual-viewport-height,100dvh)");
    });
});
