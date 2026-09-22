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

    it("ensures zero text-caption sm:text-body anti-pattern in account and profile components", () => {
        const profileDir = path.join(WEB_SRC, "components", "user", "profile");
        const profileFiles = collectSourceFiles(profileDir, [".tsx"]);
        const accountFiles = [
            path.join(WEB_SRC, "components", "user", "AccountNavItemList.tsx"),
            path.join(WEB_SRC, "components", "user", "AccountHeader.tsx"),
            path.join(WEB_SRC, "components", "user", "MobileAccountBottomNav.tsx"),
            path.join(WEB_SRC, "components", "user", "ProfileSettingsSidebar.tsx"),
        ];
        const allFiles = [...profileFiles, ...accountFiles.filter((f) => fs.existsSync(f))];
        const violations: string[] = [];

        for (const file of allFiles) {
            const content = fs.readFileSync(file, "utf-8");
            if (/text-caption\s+(sm|md):text-body/.test(content)) {
                violations.push(
                    `${path.relative(WEB_SRC, file)}: contains anti-pattern "text-caption sm:text-body" which causes mobile typography inconsistency`,
                );
            }
        }

        expect(violations).toEqual([]);
    });

    it("ensures zero non-SSOT typography tokens in account profile components", () => {
        const profileDir = path.join(WEB_SRC, "components", "user", "profile");
        const profileFiles = collectSourceFiles(profileDir, [".tsx"]);
        const FORBIDDEN_DEFAULT_TOKENS = [
            /\btext-xs\b/,
            /\btext-sm\b(?!\s*:\s*)/,
            /\btext-lg\b/,
            /\btext-xl\b/,
            /\btext-2xl\b/,
            /\btext-3xl\b/,
            /\btext-4xl\b/,
        ];
        const violations: string[] = [];

        for (const file of profileFiles) {
            const content = fs.readFileSync(file, "utf-8");
            // Strip out className="... text-body-lg ..." or "sm:text-..." or "placeholder:text-..."
            const lines = content.split("\n");
            lines.forEach((line, idx) => {
                // Ignore comments
                if (line.trim().startsWith("//") || line.trim().startsWith("*")) return;
                // Check each forbidden token
                for (const tokenRegex of FORBIDDEN_DEFAULT_TOKENS) {
                    // Make sure it's not preceded by body- or sm: or md: or placeholder:
                    const cleanedLine = line
                        .replace(/\btext-body-lg\b/g, "")
                        .replace(/\b(sm|md|lg|xl|2xl):text-\w+/g, "")
                        .replace(/placeholder:text-\w+/g, "");
                    if (tokenRegex.test(cleanedLine)) {
                        violations.push(
                            `${path.relative(WEB_SRC, file)}:${idx + 1}: contains non-SSOT typography token: "${line.trim()}"`,
                        );
                    }
                }
            });
        }

        expect(violations).toEqual([]);
    });

    it("ensures AccountNavItemList menu items consistently use text-body", () => {
        const navListPath = path.join(WEB_SRC, "components", "user", "AccountNavItemList.tsx");
        const content = fs.readFileSync(navListPath, "utf-8");
        expect(content).toContain("text-body");
        expect(content).not.toContain("text-caption sm:text-body");
    });

    it("ensures form inputs in profile tabs enforce mobile zoom prevention (Rule #7)", () => {
        const profileTabsDir = path.join(WEB_SRC, "components", "user", "profile", "tabs");
        const tabFiles = collectSourceFiles(profileTabsDir, [".tsx"]);
        const violations: string[] = [];

        for (const file of tabFiles) {
            const content = fs.readFileSync(file, "utf-8");
            // Find <Input or <input matches
            const inputMatches = content.matchAll(/<Input\b([^>]*?)>/g);
            for (const match of inputMatches) {
                const attrs = match[1] ?? "";
                const classMatch = attrs.match(/className=["']([^"']*)["']/);
                if (classMatch) {
                    const classes = classMatch[1] ?? "";
                    // If className sets text-body without text-body-lg, it's 14px on mobile
                    if (/\btext-body\b/.test(classes) && !/\btext-body-lg\b/.test(classes)) {
                        violations.push(
                            `${path.relative(WEB_SRC, file)}: Input has sub-16px mobile class "${classes}" (must use text-body-lg md:text-body)`,
                        );
                    }
                }
            }
        }

        expect(violations).toEqual([]);
    });

    it("ensures zero alien font weights (font-black, font-extrabold) in profile components", () => {
        const profileDir = path.join(WEB_SRC, "components", "user", "profile");
        const files = collectSourceFiles(profileDir, [".tsx"]);
        const violations: string[] = [];

        for (const file of files) {
            const content = fs.readFileSync(file, "utf-8");
            if (/\bfont-(black|extrabold)\b/.test(content)) {
                violations.push(
                    `${path.relative(WEB_SRC, file)}: contains alien font weight (only normal, medium, semibold, bold are permitted)`,
                );
            }
        }

        expect(violations).toEqual([]);
    });

    it("ensures zero ghost navigation states in mobile bottom nav for all profile tab values", async () => {
        const { resolveBottomNavActiveTab } = await import("../components/user/MobileAccountBottomNav");
        const allTabValues: Array<"personal" | "mylistings" | "messages" | "saved" | "business" | "plans" | "buyplans" | "settings" | "smartalerts" | "purchases" | "more"> = [
            "personal",
            "mylistings",
            "messages",
            "saved",
            "business",
            "plans",
            "buyplans",
            "settings",
            "smartalerts",
            "purchases",
            "more",
        ];

        const validBottomNavItems = ["personal", "mylistings", "messages", "smartalerts", "more"];

        for (const tab of allTabValues) {
            const resolved = resolveBottomNavActiveTab(tab);
            expect(validBottomNavItems).toContain(resolved);
        }

        // Secondary tabs must resolve to "more" so they are highlighted properly
        expect(resolveBottomNavActiveTab("settings")).toBe("more");
        expect(resolveBottomNavActiveTab("plans")).toBe("more");
        expect(resolveBottomNavActiveTab("saved")).toBe("more");
        expect(resolveBottomNavActiveTab("business")).toBe("more");
        expect(resolveBottomNavActiveTab("buyplans")).toBe("more");
    });

    it("ensures child account tabs do not declare competing max-w-* container classes", () => {
        const tabsDir = path.join(WEB_SRC, "components", "user", "profile", "tabs");
        const tabFiles = ["PlansTab.tsx", "BusinessTab.tsx", "SettingsTab.tsx"];
        const violations: string[] = [];

        for (const fileName of tabFiles) {
            const filePath = path.join(tabsDir, fileName);
            if (!fs.existsSync(filePath)) continue;
            const content = fs.readFileSync(filePath, "utf-8");
            // Match outer container className containing max-w-2xl, max-w-4xl, etc.
            if (/className="[^"]*max-w-(2xl|4xl|5xl|6xl|7xl)[^"]*"/.test(content)) {
                violations.push(
                    `${fileName}: contains conflicting root max-w-* (layout shell in ProfileSettingsSidebar must own container width)`,
                );
            }
        }

        expect(violations).toEqual([]);
    });

    it("ensures zero placeholder:text-small overrides exist across all components", () => {
        const componentsDir = path.join(WEB_SRC, "components");
        const componentFiles = collectSourceFiles(componentsDir, [".tsx"]);
        const violations: string[] = [];

        for (const file of componentFiles) {
            const content = fs.readFileSync(file, "utf-8");
            if (content.includes("placeholder:text-small")) {
                violations.push(
                    `${path.relative(WEB_SRC, file)}: contains placeholder:text-small (must use placeholder:text-foreground-subtle)`,
                );
            }
        }

        expect(violations).toEqual([]);
    });

    it("ensures ReportChatDialog consumes @esparex/ui primitives rather than raw HTML", () => {
        const reportChatPath = path.join(WEB_SRC, "components", "chat", "ReportChatDialog.tsx");
        const content = fs.readFileSync(reportChatPath, "utf-8");
        expect(content).not.toContain("<select");
        expect(content).not.toContain("<textarea");
        expect(content).toContain("<Select");
        expect(content).toContain("<Textarea");
        expect(content).not.toContain("⚑");
    });
});
