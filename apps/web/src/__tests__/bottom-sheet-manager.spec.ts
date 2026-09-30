import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("BottomSheetManager & Overlay Host Infinite Loop Prevention Governance", () => {
    const webSrc = path.resolve(__dirname, "..");

    it("ensures BottomSheetManagerContext uses useRef for sheet registrations to avoid render loops", () => {
        const contextPath = path.join(webSrc, "context", "BottomSheetManagerContext.tsx");
        const content = fs.readFileSync(contextPath, "utf-8");

        // Must use useRef for registered sheets instead of useState to prevent cascading re-renders
        expect(content).toContain("sheetsRef = useRef<Map<string, { onClose?: () => void }>>(new Map())");
        expect(content).not.toContain("setRegisteredSheets");

        // openSheet, closeSheet, closeAll must not depend on registeredSheets state
        expect(content).not.toMatch(/useCallback\(.*\[registeredSheets\]\)/s);
    });

    it("ensures LocationOverlayHost stabilizes onClose with useRef to prevent re-registration cycles", () => {
        const hostPath = path.join(webSrc, "components", "location", "LocationOverlayHost.tsx");
        const content = fs.readFileSync(hostPath, "utf-8");

        // Must use onCloseRef so registerSheet effect is not torn down on every parent render
        expect(content).toContain("const onCloseRef = useRef(onClose)");
        expect(content).toContain("onCloseRef.current = onClose");
        expect(content).toContain("onCloseRef.current()");

        // Effect dependency must only be registerSheet and unregisterSheet
        expect(content).toMatch(/registerSheet\(.*onCloseRef\.current/);
        expect(content).toContain("[registerSheet, unregisterSheet]");
    });

    it("ensures Header memoizes handleCloseLocationOverlay callback", () => {
        const headerPath = path.join(webSrc, "components", "user", "Header.tsx");
        const content = fs.readFileSync(headerPath, "utf-8");

        expect(content).toContain("handleCloseLocationOverlay = useCallback(");
        expect(content).toContain("onClose={handleCloseLocationOverlay}");
    });
});
