import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("Frontend Route Integrity (FIND-001 & FIND-002)", () => {
    const webSrcDir = path.resolve(__dirname, "..");

    it("verifies useListingSubmission uses canonical /account/ads route instead of /my-account/listings", () => {
        const filePath = path.join(webSrcDir, "hooks/listings/useListingSubmission.ts");
        const content = fs.readFileSync(filePath, "utf8");

        expect(content).not.toContain("/my-account/listings");
        expect(content).toContain('window.location.href = "/account/ads"');
    });

    it("verifies BusinessApplicationStatus uses canonical /contact route instead of /support", () => {
        const filePath = path.join(webSrcDir, "components/user/profile/BusinessApplicationStatus.tsx");
        const content = fs.readFileSync(filePath, "utf8");

        expect(content).not.toContain("'/support'");
        expect(content).not.toContain('"/support"');
        expect(content).toContain("window.location.href = '/contact'");
    });

    it("verifies PostAdWizard uses SPA navigation for plans and navigates directly on close without popup", () => {
        const filePath = path.join(webSrcDir, "components/user/post-ad/PostAdWizard.tsx");
        const content = fs.readFileSync(filePath, "utf8");

        expect(content).not.toContain('window.location.href = "/account/plans"');
        expect(content).toContain('navigateTo("plans-payments")');
        expect(content).not.toContain("showCancelConfirmDialog");
        expect(content).not.toContain("Discard Unsaved Changes?");
    });
});
