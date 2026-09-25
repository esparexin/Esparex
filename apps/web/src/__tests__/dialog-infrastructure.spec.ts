import { describe, it, expect } from "vitest";
import { Z_INDEX } from "@esparex/ui";

describe("Platform Dialog System Governance & Infrastructure Audit", () => {
  it("enforces the architectural stacking invariant across headers, dialogs, and alert dialogs", () => {
    // Architectural Invariant:
    // alertDialogContent (1110) > alertDialogOverlay (1100) > dialogContent (1010) > dialogOverlay (1000) > userHeader (999)
    expect(Z_INDEX.userHeader).toBe(999);
    expect(Z_INDEX.desktopHeader).toBe(999);

    expect(Z_INDEX.dialogOverlay).toBeGreaterThan(Z_INDEX.userHeader);
    expect(Z_INDEX.dialogContent).toBeGreaterThan(Z_INDEX.dialogOverlay);

    expect(Z_INDEX.alertDialogOverlay).toBeGreaterThan(Z_INDEX.dialogContent);
    expect(Z_INDEX.alertDialogContent).toBeGreaterThan(Z_INDEX.alertDialogOverlay);

    // Exact expected z-index tokens
    expect(Z_INDEX.dialogOverlay).toBe(1000);
    expect(Z_INDEX.dialogContent).toBe(1010);
    expect(Z_INDEX.alertDialogOverlay).toBe(1100);
    expect(Z_INDEX.alertDialogContent).toBe(1110);
  });

  it("verifies single-instance responsive dialog z-indices for wizard and listing modals", () => {
    expect(Z_INDEX.wizardModal).toBe(Z_INDEX.dialogContent);
    expect(Z_INDEX.listingModal).toBe(Z_INDEX.dialogContent);
    expect(Z_INDEX.authModalOverlay).toBe(Z_INDEX.dialogOverlay);
    expect(Z_INDEX.authModalContent).toBe(Z_INDEX.dialogContent);
  });

  it("exports useIsMobileDevice for device-aware upload source selection", async () => {
    const { useIsMobileDevice } = await import("@/hooks/useMobile");
    expect(typeof useIsMobileDevice).toBe("function");
  });

  it("enforces keyboard height elevation variables across bottom sheets, dialogs, and drawers", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const sheetPath = path.resolve(__dirname, "../../../../packages/ui/src/feedback/Sheet.tsx");
    const dialogPath = path.resolve(__dirname, "../../../../packages/ui/src/feedback/Dialog.tsx");
    const drawerPath = path.resolve(__dirname, "../../../../packages/ui/src/feedback/Drawer.tsx");

    const sheetContent = fs.readFileSync(sheetPath, "utf-8");
    const dialogContent = fs.readFileSync(dialogPath, "utf-8");
    const drawerContent = fs.readFileSync(drawerPath, "utf-8");

    // Sheet bottom variant must anchor to --keyboard-height
    expect(sheetContent).toContain("bottom-[var(--keyboard-height,0px)]");

    // Dialog bottomSheet variant must anchor to --keyboard-height
    expect(dialogContent).toContain("bottom-[var(--keyboard-height,0px)]");

    // Drawer must anchor to --keyboard-height
    expect(drawerContent).toContain("bottom-[var(--keyboard-height,0px)]");
  });
});
