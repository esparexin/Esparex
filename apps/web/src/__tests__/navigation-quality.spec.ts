import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("Navigation Quality Verification (FIND-011)", () => {
    const webSrcDir = path.resolve(__dirname, "..");

    it("verifies post-ad/page.tsx uses next/link rather than plain <a> tags", () => {
        const filePath = path.join(webSrcDir, "app/(private)/post-ad/page.tsx");
        const content = fs.readFileSync(filePath, "utf8");

        expect(content).toContain('import Link from "next/link"');
        expect(content).toContain('<Link\n                            href="/account/plans"');
        expect(content).toContain('<Link\n                            href="/"');
        expect(content).not.toContain('<a\n                            href="/account/plans"');
    });
});
