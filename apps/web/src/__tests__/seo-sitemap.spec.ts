import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import sitemap, {
    sanitiseSlug,
    buildSitemapApiUrl,
    formatSitemapDate,
} from "@/app/sitemap";
import robots from "@/app/robots";

describe("SEO & Sitemap Hardening Regression Suite", () => {
    describe("1. sanitiseSlug", () => {
        it("strips parentheses and characters invalid in RFC 3986 URL paths", () => {
            expect(sanitiseSlug("iPhone 13 (Pro) Max")).toBe("iphone-13-pro-max");
            expect(sanitiseSlug("Samsung Galaxy S22+ (Ultra)")).toBe("samsung-galaxy-s22-ultra");
            expect(sanitiseSlug("Screen & Battery (Original)")).toBe("screen-battery-original");
        });

        it("collapses multiple dashes and strips leading/trailing dashes", () => {
            expect(sanitiseSlug("--bad---slug--")).toBe("bad-slug");
            expect(sanitiseSlug("")).toBe("");
        });
    });

    describe("2. buildSitemapApiUrl & Query Parameter Safety (BUG-1)", () => {
        it("constructs API URLs with proper query params and never produces double '?'", () => {
            const url = buildSitemapApiUrl("https://api.esparex.in/api/v1", "listings", {
                listingType: "ad",
                status: "live",
            });

            expect(url).not.toContain("??");
            expect(url).not.toContain("?listingType=ad?limit");
            expect(url.split("?").length).toBe(2);

            const parsed = new URL(url);
            expect(parsed.searchParams.get("listingType")).toBe("ad");
            expect(parsed.searchParams.get("status")).toBe("live");
            expect(parsed.searchParams.get("limit")).toBe("1000");
            expect(parsed.searchParams.get("page")).toBe("1");
        });

        it("handles trailing and leading slashes safely", () => {
            const url = buildSitemapApiUrl("https://api.esparex.in/api/v1/", "/businesses", {});
            expect(url).toContain("https://api.esparex.in/api/v1/businesses?");
            expect(url).not.toContain("v1//businesses");
        });
    });

    describe("3. formatSitemapDate", () => {
        it("formats date to W3C format without milliseconds", () => {
            const formatted = formatSitemapDate("2026-09-04T10:20:30.123Z");
            expect(formatted).toBe("2026-09-04T10:20:30Z");
            expect(formatted).not.toMatch(/\.\d{3}Z$/);
        });
    });

    describe("4. Sitemap Generation & Policy Validation", () => {
        const originalFetch = global.fetch;

        beforeEach(() => {
            // Mock fetch to simulate API returning live listings
            global.fetch = vi.fn().mockImplementation(async (url: string) => {
                if (url.includes("listingType=ad")) {
                    return {
                        ok: true,
                        json: async () => ({
                            data: [
                                { id: "ad-1", seoSlug: "iphone-13", updatedAt: "2026-09-01T00:00:00.000Z" },
                                { id: "ad-2", seoSlug: "samsung-s21", updatedAt: "2026-09-02T00:00:00.000Z" },
                            ],
                        }),
                    };
                }
                if (url.includes("listingType=service")) {
                    return {
                        ok: true,
                        json: async () => ({
                            data: [
                                { id: "srv-1", slug: "screen-repair", updatedAt: "2026-09-01T00:00:00.000Z" },
                            ],
                        }),
                    };
                }
                if (url.includes("listingType=spare_part")) {
                    return {
                        ok: true,
                        json: async () => ({
                            data: [
                                { id: "part-1", slug: "oled-display", updatedAt: "2026-09-01T00:00:00.000Z" },
                                { id: "part-2", slug: "battery-5000mah", updatedAt: "2026-09-02T00:00:00.000Z" },
                            ],
                        }),
                    };
                }
                if (url.includes("businesses")) {
                    return {
                        ok: true,
                        json: async () => ({
                            data: [
                                { id: "biz-1", slug: "apex-repairs", updatedAt: "2026-09-01T00:00:00.000Z" },
                            ],
                        }),
                    };
                }
                return { ok: false, status: 404 };
            });
        });

        afterEach(() => {
            global.fetch = originalFetch;
        });

        it("contains all static canonical routes with https://esparex.in base", async () => {
            const entries = await sitemap();
            const urls = entries.map((e) => e.url);

            const expectedStatic = [
                "https://esparex.in",
                "https://esparex.in/about",
                "https://esparex.in/contact",
                "https://esparex.in/faq",
                "https://esparex.in/how-it-works",
                "https://esparex.in/privacy",
                "https://esparex.in/safety-tips",
                "https://esparex.in/site-map",
                "https://esparex.in/terms",
            ];

            for (const expected of expectedStatic) {
                expect(urls).toContain(expected);
            }
        });

        it("excludes redirect-only routes and parameter query search pages", async () => {
            const entries = await sitemap();
            const urls = entries.map((e) => e.url);

            expect(urls.some((u) => u.includes("/browse-services"))).toBe(false);
            expect(urls.some((u) => u.includes("/browse-spare-parts"))).toBe(false);
            expect(urls.some((u) => u.includes("/spare-parts/"))).toBe(false);
            expect(urls.some((u) => u.includes("/search?"))).toBe(false);
        });

        it("excludes private, account, and internal routes", async () => {
            const entries = await sitemap();
            const urls = entries.map((e) => e.url);

            expect(urls.some((u) => u.includes("/account"))).toBe(false);
            expect(urls.some((u) => u.includes("/chat"))).toBe(false);
            expect(urls.some((u) => u.includes("/post-"))).toBe(false);
            expect(urls.some((u) => u.includes("/edit-"))).toBe(false);
            expect(urls.some((u) => u.includes("/internal/"))).toBe(false);
            expect(urls.some((u) => u.includes("/api/"))).toBe(false);
        });

        it("never includes admin, staging, preview, or localhost hosts", async () => {
            const entries = await sitemap();
            const urls = entries.map((e) => e.url);

            for (const url of urls) {
                expect(url).not.toContain("localhost");
                expect(url).not.toContain("admin.esparex.in");
                expect(url).not.toContain("preview");
                expect(url).not.toContain("staging");
                expect(url.startsWith("https://esparex.in")).toBe(true);
            }
        });

        it("includes spare-part listings with canonical slug-id format (BUG-2, BUG-6, BUG-8)", async () => {
            const entries = await sitemap();
            const urls = entries.map((e) => e.url);

            const sparePartUrls = urls.filter((u) => u.includes("/spare-part-listings/"));
            expect(sparePartUrls.length).toBeGreaterThan(0);
            expect(sparePartUrls).toContain("https://esparex.in/spare-part-listings/oled-display-part-1");
            expect(sparePartUrls).toContain("https://esparex.in/spare-part-listings/battery-5000mah-part-2");
        });

        it("uses canonical category slugs and avoids redirect aliases", async () => {
            const entries = await sitemap();
            const urls = entries.map((e) => e.url);

            // Must use canonical 'mobiles', NOT 'mobile-phones' which issues 301
            expect(urls).toContain("https://esparex.in/category/mobiles");
            expect(urls).not.toContain("https://esparex.in/category/mobile-phones");
            expect(urls).toContain("https://esparex.in/category/tablets");
            expect(urls).toContain("https://esparex.in/category/laptops");
            expect(urls).toContain("https://esparex.in/category/spare-parts");
        });

        it("contains zero duplicate URLs", async () => {
            const entries = await sitemap();
            const urls = entries.map((e) => e.url);
            const uniqueUrls = new Set(urls);
            expect(urls.length).toBe(uniqueUrls.size);
        });
    });

    describe("5. Web Robots Policy", () => {
        it("explicitly disallows all sensitive and private routes", () => {
            const result = robots();
            const rules = result.rules;
            const disallow = Array.isArray(rules) ? rules[0]?.disallow : rules?.disallow;
            const disallowList = Array.isArray(disallow) ? disallow : [disallow || ""];

            expect(disallowList).toContain("/account/");
            expect(disallowList).toContain("/chat");
            expect(disallowList).toContain("/chat/");
            expect(disallowList).toContain("/post-ad");
            expect(disallowList).toContain("/post-service");
            expect(disallowList).toContain("/post-spare-part-listing");
            expect(disallowList).toContain("/edit-ad/");
            expect(disallowList).toContain("/edit-service/");
            expect(disallowList).toContain("/edit-spare-part/");
            expect(disallowList).toContain("/business/edit");
            expect(disallowList).toContain("/internal/");
            expect(disallowList).toContain("/api/");
            expect(disallowList).toContain("/admin/");

            expect(result.sitemap).toBe("https://esparex.in/sitemap.xml");
        });
    });

    describe("6. Sensitive Form Placeholders Security Verification", () => {
        const repoRoot = path.resolve(__dirname, "../../../..");

        it("admin login page contains no company email or default OTP placeholders", () => {
            const loginPath = path.join(repoRoot, "apps/admin/src/app/login/page.tsx");
            const content = fs.readFileSync(loginPath, "utf8");

            expect(content).not.toContain('placeholder="admin@esparex.com"');
            expect(content).not.toContain('placeholder="000000"');
            expect(content).toContain('placeholder="Your admin email address"');
            expect(content).toContain('placeholder="6-digit code"');
        });

        it("AdminUserFormCard enforces autoComplete and non-label placeholders", () => {
            const cardPath = path.join(repoRoot, "apps/admin/src/components/system/adminUsers/AdminUserFormCard.tsx");
            const content = fs.readFileSync(cardPath, "utf8");

            expect(content).not.toMatch(/placeholder="Password"/);
            expect(content).toContain('placeholder="Set initial password"');
            expect(content).toContain('autoComplete="new-password"');
            expect(content).toContain('placeholder="Admin email address"');
            expect(content).toContain('autoComplete="email"');
        });

        it("admin users page and schemas use canonical listings:write instead of ads:write in examples", () => {
            const pagePath = path.join(repoRoot, "apps/admin/src/app/(protected)/(system)/admin-users/page.tsx");
            const content = fs.readFileSync(pagePath, "utf8");

            expect(content).not.toContain('placeholder="users:read, ads:write, ..."');
            expect(content).toContain('placeholder="e.g. users:read, listings:write"');
        });

        it("campaign settings modal uses safe example.com domain", () => {
            const modalPath = path.join(repoRoot, "apps/admin/src/app/(protected)/(system)/settings/components/monetization/CampaignEditModal.tsx");
            const content = fs.readFileSync(modalPath, "utf8");

            expect(content).not.toContain('placeholder="https://partner.com"');
            expect(content).toContain('placeholder="https://advertiser.example.com"');
            expect(content).toContain('placeholder="Google AdSense slot ID"');
        });

        it("user profile email placeholder uses personal generic email", () => {
            const emailSectionPath = path.join(repoRoot, "apps/web/src/components/user/profile/tabs/PersonalProfileEmailSection.tsx");
            const content = fs.readFileSync(emailSectionPath, "utf8");

            expect(content).not.toContain('placeholder="name@company.com"');
            expect(content).toContain('placeholder="your@email.com"');
        });
    });
});
