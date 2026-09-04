import { describe, expect, it } from "vitest";

import {
  CANONICAL_ORIGIN,
  CANONICAL_HOSTNAME,
  toCanonicalUrl,
  normalizeHost,
  isCanonicalHost,
} from "@/lib/seo/canonicalHost";
import { sanitiseSlug } from "@/app/sitemap";
import webRobots from "@/app/robots";
import adminRobots from "../../../admin/src/app/robots";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo/brandEntitySchema";
import { getCanonicalCategorySlug } from "@/lib/seo/canonicalSlugs";

describe("SEO Canonical Host & Host Isolation SSOT", () => {
  it("enforces canonical origin as https://esparex.in", () => {
    expect(CANONICAL_ORIGIN).toBe("https://esparex.in");
    expect(CANONICAL_HOSTNAME).toBe("esparex.in");
  });

  it("resolves canonical URLs properly", () => {
    expect(toCanonicalUrl("/")).toBe("https://esparex.in/");
    expect(toCanonicalUrl("")).toBe("https://esparex.in/");
    expect(toCanonicalUrl("/search")).toBe("https://esparex.in/search");
    expect(toCanonicalUrl("search")).toBe("https://esparex.in/search");
    expect(toCanonicalUrl("/ads/display-123/")).toBe("https://esparex.in/ads/display-123");
  });

  it("normalizes and validates host names strictly", () => {
    expect(normalizeHost("esparex.in:3000")).toBe("esparex.in");
    expect(normalizeHost("ESPAREX.IN")).toBe("esparex.in");
    expect(isCanonicalHost("esparex.in")).toBe(true);
    expect(isCanonicalHost("www.esparex.in")).toBe(false);
    expect(isCanonicalHost("admin.esparex.in")).toBe(false);
    expect(isCanonicalHost("staging.esparex.in")).toBe(false);
    expect(isCanonicalHost("localhost:3000")).toBe(false);
  });
});

describe("Robots Configuration & Crawl Protection", () => {
  it("protects private and internal routes on public web app", () => {
    const robotsConfig = webRobots();
    const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;
    const disallow = Array.isArray(rules?.disallow) ? rules.disallow : [rules?.disallow];

    expect(robotsConfig.sitemap).toBe("https://esparex.in/sitemap.xml");
    expect(disallow).toContain("/account/");
    expect(disallow).toContain("/chat");
    expect(disallow).toContain("/chat/");
    expect(disallow).toContain("/post-ad");
    expect(disallow).toContain("/post-service");
    expect(disallow).toContain("/post-spare-part-listing");
    expect(disallow).toContain("/edit-ad/");
    expect(disallow).toContain("/edit-service/");
    expect(disallow).toContain("/edit-spare-part/");
    expect(disallow).toContain("/business/edit");
    expect(disallow).toContain("/internal/");
    expect(disallow).toContain("/offline");
    expect(disallow).toContain("/unauthorized");
    expect(disallow).toContain("/api/");
    expect(disallow).toContain("/admin/");
  });

  it("completely disallows all crawlers from admin app", () => {
    const adminConfig = adminRobots();
    const rules = Array.isArray(adminConfig.rules) ? adminConfig.rules[0] : adminConfig.rules;
    expect(rules?.userAgent).toBe("*");
    expect(rules?.disallow).toBe("/");
    expect(adminConfig.sitemap).toBeUndefined();
  });
});

describe("Sitemap Slugs & Category Normalization", () => {
  it("sanitises raw slugs to RFC-safe format", () => {
    expect(sanitiseSlug("Battery (Original) - 5000mAh")).toBe("battery-original-5000mah");
    expect(sanitiseSlug("Samsung Galaxy S23 Ultra!")).toBe("samsung-galaxy-s23-ultra");
    expect(sanitiseSlug("--double--hyphens--")).toBe("double-hyphens");
  });

  it("maps category aliases to canonical categories to prevent sitemap 301 redirects", () => {
    expect(getCanonicalCategorySlug("mobile-phones")).toBe("mobiles");
    expect(getCanonicalCategorySlug("smartphones")).toBe("mobiles");
    expect(getCanonicalCategorySlug("smart-tv")).toBe("led-tvs");
    expect(getCanonicalCategorySlug("laptop")).toBe("laptops");
    expect(getCanonicalCategorySlug("tablet")).toBe("tablets");
  });
});

describe("Brand & Entity Structured Data", () => {
  it("builds an authoritative Organization schema linked to India", () => {
    const org = buildOrganizationSchema();
    expect(org["@type"]).toBe("Organization");
    expect(org["@id"]).toBe("https://esparex.in/#organization");
    expect(org.name).toBe("Esparex");
    expect(org.alternateName).toContain("Esparex Marketplace");
    expect(org.areaServed).toEqual({ "@type": "Country", name: "India" });
    expect(org.url).toBe("https://esparex.in");
    expect(org.logo.url).toContain("https://esparex.in");
  });

  it("links WebSite schema to Organization publisher entity", () => {
    const site = buildWebSiteSchema();
    expect(site["@type"]).toBe("WebSite");
    expect(site["@id"]).toBe("https://esparex.in/#website");
    expect(site.publisher["@id"]).toBe("https://esparex.in/#organization");
    expect(site.url).toBe("https://esparex.in/");
    expect(site.potentialAction.target).toBe("https://esparex.in/search?q={search_term_string}");
  });
});
