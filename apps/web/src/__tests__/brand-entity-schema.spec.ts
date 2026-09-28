import { describe, expect, it } from "vitest";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo/brandEntitySchema";
import {
    buildWebPageSchema,
    buildContactPageSchema,
    buildAboutPageSchema,
} from "@/lib/seo/schemaBuilders";
import { CANONICAL_ORIGIN } from "@/lib/seo/canonicalHost";
import { ESPAREX_COMPANY_IDENTITY } from "@esparex/contracts";

describe("Brand Entity Schema & Google Disambiguation Verification", () => {
    describe("1. buildOrganizationSchema (SSOT Entity Disambiguation)", () => {
        it("strictly outputs canonical entity name 'Esparex'", () => {
            const schema = buildOrganizationSchema();
            expect(schema["@type"]).toBe("Organization");
            expect(schema.name).toBe("Esparex");
            expect(schema.url).toBe(CANONICAL_ORIGIN);
            expect(schema.url).toBe("https://esparex.in");
        });

        it("points to official canonical logo asset", () => {
            const schema = buildOrganizationSchema();
            expect(schema.logo).toBeDefined();
            expect(schema.logo.url).toBe("https://esparex.in/icons/logo.png");
            expect(schema.logo.width).toBe(495);
            expect(schema.logo.height).toBe(112);
        });

        it("includes authoritative sameAs social profiles for entity verification", () => {
            const schema = buildOrganizationSchema();
            expect(Array.isArray(schema.sameAs)).toBe(true);
            expect(schema.sameAs).toContain("https://x.com/esparexin");
            expect(schema.sameAs).toContain("https://twitter.com/esparexin");
            expect(schema.sameAs).toContain("https://github.com/esparexin");
        });

        it("does NOT contain alternateName that dilutes exact brand token", () => {
            const schema = buildOrganizationSchema() as Record<string, unknown>;
            expect(schema.alternateName).toBeUndefined();
        });

        it("does NOT establish entity association with third-party Sparex", () => {
            const schemaStr = JSON.stringify(buildOrganizationSchema());
            expect(schemaStr).not.toMatch(/"[^"]*\bSparex\b[^"]*"/i);
        });
    });

    describe("2. buildWebSiteSchema (Site-Wide Publisher Linking)", () => {
        it("links publisher directly to Organization entity ID", () => {
            const schema = buildWebSiteSchema();
            expect(schema["@type"]).toBe("WebSite");
            expect(schema.name).toBe("Esparex");
            expect(schema.url).toBe("https://esparex.in/");
            expect(schema.publisher["@id"]).toBe("https://esparex.in/#organization");
        });
    });

    describe("3. schemaBuilders Consistency Across Informational Pages", () => {
        it("buildAboutPageSchema sets mainEntity Organization name to Esparex", () => {
            const schema = buildAboutPageSchema();
            expect(schema["@type"]).toBe("AboutPage");
            expect(schema.mainEntity.name).toBe("Esparex");
            expect(schema.mainEntity.url).toBe("https://esparex.in");
            expect(schema.mainEntity.sameAs).toContain("https://x.com/esparexin");
            expect(schema.mainEntity.logo.url).toBe("https://esparex.in/icons/logo.png");
        });

        it("buildContactPageSchema sets mainEntity Organization name to Esparex", () => {
            const schema = buildContactPageSchema();
            expect(schema["@type"]).toBe("ContactPage");
            expect(schema.mainEntity.name).toBe("Esparex");
            expect(schema.mainEntity.url).toBe("https://esparex.in");
            expect(schema.mainEntity.sameAs).toContain("https://x.com/esparexin");
            expect(schema.mainEntity.logo.url).toBe("https://esparex.in/icons/logo.png");
        });

        it("buildWebPageSchema sets publisher Organization name to Esparex", () => {
            const schema = buildWebPageSchema({
                name: "Test Page",
                description: "Test description",
                url: "https://esparex.in/test",
            });
            expect(schema.publisher.name).toBe("Esparex");
            expect(schema.publisher.url).toBe("https://esparex.in");
            expect(schema.publisher.logo.url).toBe("https://esparex.in/icons/logo.png");
        });
    });

    describe("4. Contracts ESPAREX_COMPANY_IDENTITY SSOT Verification", () => {
        it("enforces canonical websiteUrl and supportEmail in contracts", () => {
            expect(ESPAREX_COMPANY_IDENTITY.tradeName).toBe("Esparex");
            expect(ESPAREX_COMPANY_IDENTITY.websiteUrl).toBe("https://esparex.in");
            expect(ESPAREX_COMPANY_IDENTITY.supportEmail).toBe("support@esparex.in");
            expect(ESPAREX_COMPANY_IDENTITY.legalName).toBe("Esparex Marketplace Private Limited");
        });
    });

    describe("5. Public Layout & Homepage Brand Title Hardening", () => {
        it("homepage metadata begins with canonical brand 'Esparex'", async () => {
            const { metadata } = await import("@/app/(public)/page");
            const titleObj = metadata.title as { absolute?: string };
            expect(titleObj?.absolute).toBeDefined();
            expect(titleObj?.absolute?.startsWith("Esparex")).toBe(true);
            expect(titleObj?.absolute).toBe("Esparex — India's Marketplace for Mobile Spare Parts & Tech Repair");
            expect(metadata.openGraph?.title).toBe("Esparex — India's Marketplace for Mobile Spare Parts & Tech Repair");
            expect(metadata.openGraph?.siteName).toBe("Esparex");
        });

        it("public layout default title begins with canonical brand 'Esparex'", async () => {
            const { metadata } = await import("@/app/(public)/layout");
            const titleObj = metadata.title as { default?: string; template?: string };
            expect(titleObj?.default).toBeDefined();
            expect(titleObj?.default?.startsWith("Esparex")).toBe(true);
            expect(titleObj?.template).toBe("%s | Esparex");
        });
    });
});

