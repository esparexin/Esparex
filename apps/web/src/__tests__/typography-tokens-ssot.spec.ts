import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const WEB_SRC = path.resolve(__dirname, "..");

function collectSourceFiles(dir: string, ext: string[]): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== "__tests__") {
                results.push(...collectSourceFiles(fullPath, ext));
            }
        } else if (ext.some((e) => entry.name.endsWith(e))) {
            results.push(fullPath);
        }
    }
    return results;
}

describe("Mobile Typography & Layout SSOT Governance", () => {
    it("ensures zero hallucinated/alien typography classes exist in apps/web/src", () => {
        const sourceFiles = collectSourceFiles(WEB_SRC, [".tsx", ".ts"]);
        const FORBIDDEN_TOKENS = ["text-3xs", "text-heading-sm", "text-headline", "text-title"];
        const violations: string[] = [];

        for (const file of sourceFiles) {
            const content = fs.readFileSync(file, "utf-8");
            for (const token of FORBIDDEN_TOKENS) {
                const regex = new RegExp(`\\b${token}\\b`);
                if (regex.test(content)) {
                    violations.push(`${path.relative(WEB_SRC, file)}: found forbidden token "${token}"`);
                }
            }
        }

        expect(violations).toEqual([]);
    });

    it("ensures zero zombie .account-* utility classes exist in globals.css", () => {
        const globalsCssPath = path.join(WEB_SRC, "styles", "globals.css");
        const content = fs.readFileSync(globalsCssPath, "utf-8");
        const FORBIDDEN_ACCOUNT_CLASSES = [
            ".account-page-title",
            ".account-section-title",
            ".account-body-text",
            ".account-card-surface",
            ".account-price-stat",
            ".account-field-label",
            ".account-input-text",
            ".account-micro-text",
            ".account-container",
        ];

        const found = FORBIDDEN_ACCOUNT_CLASSES.filter((cls) => content.includes(cls));
        expect(found).toEqual([]);
    });

    it("ensures SelectTrigger does not override mobile base font size with sub-16px tokens", () => {
        const componentFiles = collectSourceFiles(path.join(WEB_SRC, "components"), [".tsx"]);
        const violations: string[] = [];

        for (const file of componentFiles) {
            const content = fs.readFileSync(file, "utf-8");
            // Match <SelectTrigger ... className="..." ...>
            const matches = content.matchAll(/<SelectTrigger\b([^>]*?)>/g);
            for (const match of matches) {
                const attrs = match[1] ?? "";
                const classMatch = attrs.match(/className=["']([^"']*)["']/);
                if (classMatch) {
                    const classes = classMatch[1] ?? "";
                    if ((classes.includes("text-caption") || classes.includes("text-xs")) && !classes.includes("text-body-lg")) {
                        violations.push(
                            `${path.relative(WEB_SRC, file)}: SelectTrigger has sub-16px class "${classes}" which triggers iOS Safari zoom`,
                        );
                    }
                }
            }
        }

        expect(violations).toEqual([]);
    });

    it("ensures BusinessPostFAB suppresses on account, chat, and admin routes", () => {
        const fabPath = path.join(WEB_SRC, "components", "layout", "BusinessPostFAB.tsx");
        const content = fs.readFileSync(fabPath, "utf-8");
        expect(content).toContain('pathname?.startsWith("/account")');
        expect(content).toContain('pathname?.startsWith("/chat")');
        expect(content).toContain('pathname?.startsWith("/admin")');
    });
});
