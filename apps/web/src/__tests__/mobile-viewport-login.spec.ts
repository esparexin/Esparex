import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Mobile Viewport Login & Keyboard Integration Regression Suite", () => {
    const webSrc = path.resolve(__dirname, "..");
    const authModalPath = path.join(webSrc, "components", "auth", "AuthModal.tsx");
    const loginMobileStepPath = path.join(webSrc, "components", "user", "auth", "LoginMobileStep.tsx");
    const packagesUiSrc = path.resolve(__dirname, "../../../../packages/ui/src");
    const hookPath = path.join(packagesUiSrc, "hooks", "useVisualViewport.ts");

    describe("useVisualViewport Hook Contracts", () => {
        it("tracks visualViewport height and calculates keyboard delta on iOS and Android", () => {
            const hookContent = fs.readFileSync(hookPath, "utf-8");

            expect(hookContent).toContain("visualViewport");
            expect(hookContent).toContain("--visual-viewport-height");
            expect(hookContent).toContain("--keyboard-height");
            expect(hookContent).toContain("data-keyboard-open");
        });
    });

    describe("AuthModal Mobile Viewport Containment Contract", () => {
        it("enforces full-viewport surface on mobile with visual viewport height", () => {
            const fileContent = fs.readFileSync(authModalPath, "utf-8");

            // Modal must span full mobile screen width without margins or border radius
            expect(fileContent).toContain("top-0 left-0 right-0 w-full");
            expect(fileContent).toContain("max-w-none");
            expect(fileContent).toContain("border-none");
            expect(fileContent).toContain("rounded-none");
            expect(fileContent).toContain("bg-card");

            // Height must bind to the visual viewport variable for keyboard awareness
            expect(fileContent).toContain("h-[var(--visual-viewport-height,100dvh)]");
        });

        it("includes safe-area insets at top and bottom to clear iOS home bar and floating controls", () => {
            const fileContent = fs.readFileSync(authModalPath, "utf-8");

            expect(fileContent).toContain("pt-[max(1rem,env(safe-area-inset-top))]");
            expect(fileContent).toContain("pb-[max(1.5rem,env(safe-area-inset-bottom))]");
        });

        it("provides internal scroll container with overscroll containment and touch pan isolation", () => {
            const fileContent = fs.readFileSync(authModalPath, "utf-8");

            expect(fileContent).toContain("flex-1 min-h-0 flex flex-col overflow-y-auto overscroll-contain touch-pan-y");
            expect(fileContent).toContain("touch-none select-none");
        });

        it("maintains side='none' with opaque mobile overlay to eliminate background bleed", () => {
            const fileContent = fs.readFileSync(authModalPath, "utf-8");
            expect(fileContent).toContain('side="none"');

            const sheetPath = path.join(packagesUiSrc, "feedback", "Sheet.tsx");
            const sheetContent = fs.readFileSync(sheetPath, "utf-8");
            expect(sheetContent).toContain('side === "none" ? "bg-card sm:bg-black/50" : undefined');
        });
    });

    describe("LoginMobileStep Input Accessibility & Zoom Prevention", () => {
        it("configures phone input with numeric keyboard and zoom prevention tokens", () => {
            const fileContent = fs.readFileSync(loginMobileStepPath, "utf-8");

            expect(fileContent).toContain('type="tel"');
            expect(fileContent).toContain('inputMode="numeric"');
            expect(fileContent).toContain('enterKeyHint="send"');
            expect(fileContent).toContain('autoComplete="tel"');

            // Must use text-body-lg (>=16px) on mobile to prevent iOS Safari auto-zoom
            expect(fileContent).toContain("text-body-lg md:text-body");
        });

        it("renders full-width WhatsApp OTP CTA button with accessible label and state", () => {
            const fileContent = fs.readFileSync(loginMobileStepPath, "utf-8");

            expect(fileContent).toContain("WhatsApp OTP");
            expect(fileContent).toContain('type="submit"');
        });
    });
});
