# Comprehensive Google Brand, Indexing, Canonical & Search Visibility Audit

> **Branch:** `fix/seo-indexing-brand-canonicalization`  
> **Objective:** Identify and permanently remediate Google search indexing, canonicalization, sitemap, host-isolation, and brand/entity ambiguity issues (e.g. Google interpreting "esparex" as "sparex").

---

## Part I: Complete SEO & Indexing Audit (Phase 1)

### A. Domain & Host Architecture Audit
- **Canonical Public Host:** `https://esparex.in` (Apex domain).
- **Private Admin Host:** `https://admin.esparex.in`.
- **Observed Host Handling Defects:**
  1. No host-level redirect in middleware (`proxy.ts`) or `next.config.mjs` for `www.esparex.in` ➔ `esparex.in`. If requested with `www`, Next.js would serve pages directly without a 301 canonical redirect, splitting link equity and creating duplicate site instances in Google's index.
  2. Subdomain bleed-through: Arbitrary `*.esparex.in` hostnames routed to the web container could serve pages without host header canonicalization.
  3. `apps/web/src/app/layout.tsx` metadataBase fallback historically defaulted to `http://localhost:3000` when `NEXT_PUBLIC_APP_URL` was undefined, contaminating OpenGraph image and relative canonical resolutions in staging or non-configured production containers.
- **Target Host Architecture:**
  - All public web traffic on any non-canonical variant (`www.esparex.in`, `http://`, etc.) must permanently 301 redirect to `https://esparex.in`.
  - Admin domain `admin.esparex.in` must be strictly isolated at the DNS, reverse proxy, robots, header (`X-Robots-Tag`), and metadata levels.

---

### B. Robots & Crawl Control Audit
- **Public Web App (`apps/web/src/app/robots.ts`):**
  - Public routes (`/`, `/about`, `/contact`, `/faq`, `/terms`, `/privacy`, `/safety-tips`, `/how-it-works`, `/site-map`, `/search`) must be crawlable.
  - Private interactive & account endpoints must be explicitly blocked:
    - `/account/` (User dashboard, wallet, settings)
    - `/chat`, `/chat/` (Private messaging)
    - `/post-ad`, `/post-service`, `/post-spare-part-listing` (Listing wizards)
    - `/edit-ad/`, `/edit-service/`, `/edit-spare-part/` (Editor forms)
    - `/business/edit` (Business profile editor)
    - `/internal/` (Revalidation webhooks)
    - `/api/` (API endpoints)
- **Admin App (`apps/admin/src/app/robots.ts`):**
  - Requires blanket crawl prohibition: `User-agent: *`, `Disallow: /`.
  - Must serve `X-Robots-Tag: noindex, nofollow, noarchive` on all responses.
  - Root layout must declare `robots: { index: false, follow: false, nocache: true }`.

---

### C. Canonical Audit
- **Public Web Standards:**
  - Every indexable route must provide an explicit, deterministic canonical tag pointing strictly to `https://esparex.in/...`.
  - Canonical format for listings: `https://esparex.in/{basePath}/{slug}-{id}`.
  - Canonical format for businesses: `https://esparex.in/business/{slug}-{id}`.
  - Canonical format for sellers: `https://esparex.in/seller/{slug}-{id}`.
  - Canonical format for categories: `https://esparex.in/category/{canonicalCategorySlug}`.
  - Canonical format for catalog entities: `https://esparex.in/{brands|models}/{slug}-{id}`.
  - Base `/search` must canonicalize to `https://esparex.in/search`.
- **Defects Found:**
  1. Dynamic listing detail metadata in `listingDetailPage.tsx` constructed relative paths (`${canonicalBasePath}/${canonicalSlug}-${listing.id}`) rather than explicit absolute `https://esparex.in/...` URLs, relying on Next.js `metadataBase` resolution.
  2. `CatalogSlugPage.tsx` did not define `alternates: { canonical: ... }` for brand/model landing pages.
  3. Filter parameter search queries (`/search?q=...&category=...`) lacked explicit `robots: { index: false }` consolidation across all filter variations.

---

### D. Sitemap Audit
- **Sitemap Generator (`apps/web/src/app/sitemap.ts`):**
  - **Defect 1 (Double `?` Malformation):** String-interpolating `${url}?limit=1000&page=1` into an endpoint already containing `?listingType=ad` produced malformed backend queries (`...listingType=ad?limit=1000&page=1`), causing API failure or empty fallback.
  - **Defect 2 (Boolean Filter Inversion):** Spare part filtering logic `!part.slug.match(/^[a-z0-9-]+$/) === false` incorrectly evaluated, dropping 100% of spare part listings from the generated XML sitemap.
  - **Defect 3 (Redirect Ingestion):** Stale category aliases (`/category/mobile-phones`) were directly generated into sitemap URLs. Because `proxy.ts` issues a 301 redirect to `/category/mobiles`, Google Search Console flagged these as "Page with redirect".
  - **Defect 4 (Missing ID in Spare Parts):** Spare part URLs generated without `-{id}` suffix (`/spare-part-listings/${slug}`), triggering internal redirect to `${slug}-${id}`.
  - **Defect 5 (Non-Live Listing Leakage):** Queries lacked `status=live` parameter, permitting draft/pending/expired items into the sitemap.

---

### E. Indexability Matrix

| Route Pattern | Classification | Should Google Index? | Current Status | Canonical Target | Action |
|---|---|---|---|---|---|
| `/` | Static Home | YES | Indexable | `https://esparex.in/` | Add Organization & WebSite JSON-LD, refine title |
| `/about`, `/contact`, `/faq`, `/terms`, `/privacy`, `/how-it-works`, `/safety-tips`, `/site-map` | Static Informational | YES | Indexable | `https://esparex.in/{path}` | Retain in sitemap & enforce absolute canonical |
| `/search` (bare) | Search Entry | YES | Indexable | `https://esparex.in/search` | Canonical to bare `/search` |
| `/search?*` (with filters) | Filter Query | NO | `noindex` | N/A | Exclude from sitemap, serve `noindex, follow` |
| `/ads/[slug]` | Dynamic Ad Listing | YES (if live) | Indexable if live | `https://esparex.in/ads/{slug}-{id}` | Absolute canonical, live-only in sitemap |
| `/services/[slug]` | Dynamic Service | YES (if live) | Indexable if live | `https://esparex.in/services/{slug}-{id}` | Absolute canonical, live-only in sitemap |
| `/spare-part-listings/[slug]` | Dynamic Spare Part | YES (if live) | Indexable if live | `https://esparex.in/spare-part-listings/{slug}-{id}` | Fix filter & id suffix, live-only in sitemap |
| `/business/[slug]` | Business Profile | YES (if active) | Indexable | `https://esparex.in/business/{slug}-{id}` | Absolute canonical, not-found `noindex` |
| `/seller/[id]` | Seller Profile | YES (if active) | Indexable | `https://esparex.in/seller/{slug}-{id}` | Absolute canonical, not-found `noindex` |
| `/category/[category]` | Taxonomy Category | YES | Indexable | `https://esparex.in/category/{canonicalSlug}` | SSOT canonical mapping, prevent alias redirects |
| `/brands/[slug]`, `/models/[slug]` | Catalog Taxonomy | YES (if valid) | Indexable | `https://esparex.in/{brands\|models}/{slug}-{id}` | Add explicit canonical & not-found `noindex` |
| `/browse-services`, `/browse-spare-parts` | Legacy Redirect | NO | 301 Redirect | `https://esparex.in/search?type=...` | Exclude from sitemap |
| `/spare-parts/[slug]` | Legacy Redirect | NO | 301 Redirect | `https://esparex.in/spare-part-listings/...` | Exclude from sitemap |
| `/account/*`, `/chat/*`, `/post-*`, `/edit-*` | Private User App | NO | `noindex` | N/A | Block in `robots.txt`, verify `noindex` layout |
| `admin.esparex.in/*` | Admin Subdomain | NO | Unprotected | N/A | Disallow all, `noindex` header & layout metadata |

---

### F. Duplicate & Thin Content Audit
1. **Query String Canonical Pollution:** Filter combinations on `/search` (sort, minPrice, location, brands) must not generate separate indexable pages. The `hasFilters` flag correctly marks these `noindex, follow`.
2. **Slug Variations:** URLs missing the Mongo ID suffix (`/ads/iphone-13` instead of `/ads/iphone-13-64e...`) trigger a 301 redirect to the canonical slug-id format. This is sound, provided the sitemap NEVER emits the non-canonical variant.
3. **Category Redundancy:** Category aliases (`smartphones`, `mobile-phones`) redirect to `mobiles`. The sitemap must only emit canonical category paths.

---

### G. Brand & Entity Audit ("Esparex" vs. "Sparex")
- **Observed Behavior:**
  - Querying `"esparex"` prompts Google to interpret the query as `"sparex"` (a global agricultural parts manufacturer).
  - Querying `"esparex.in"` displays Esparex's indexable pages and an AI Overview correctly identifying Esparex as an Indian online marketplace for electronics and mobile spare parts.
- **Root Cause of Entity Ambiguity:**
  1. **Absence of Top-Level `Organization` Schema on Homepage:**
     The homepage (`apps/web/src/app/(public)/page.tsx`) only included a lightweight `WebSite` schema. It lacked a comprehensive `@type: "Organization"` node defining:
     - Legal name, brand name (`"Esparex"`), alternate names (`["Esparex Marketplace", "Esparex India", "Esparex.in"]`)
     - Canonical URL (`"https://esparex.in"`)
     - High-resolution logo (`"https://esparex.in/icons/icon-512x512.png"`)
     - Geographic bounding: `areaServed: { "@type": "Country", "name": "India" }`
     - Domain specialization: `knowsAbout: ["Mobile Phone Spare Parts", "Used Smartphones", "Electronics Repair Services", "Laptop Spare Parts"]`
     - Official social channels (`sameAs`)
  2. **Missing `siteName` and `applicationName` in Root Metadata:**
     `apps/web/src/app/layout.tsx` omitted `openGraph.siteName: "Esparex"` and `applicationName: "Esparex"`. Google relies on `siteName` to associate individual search results with a distinct publisher entity.
  3. **Homepage Title Prominence:**
     Homepage title placed the brand at the end (`"Buy & Sell Mobile Spare Parts Online India | Esparex"`). Leading with the brand name or providing a structured template strengthens Google's brand recognition.
  4. **Entity Linkage via `@graph`:**
     The `WebSite` entity did not declare `publisher: { "@id": "https://esparex.in/#organization" }`, preventing Google's Knowledge Graph parser from unifying the site and the company into a single authoritative entity node.

---

### H. Sensitive Information & Public Metadata Audit
- **Identified Issues:**
  1. Admin login page had `placeholder="admin@esparex.com"` (exposing corporate domain and username enumeration hints).
  2. Admin login 2FA field had `placeholder="000000"` (resembling a default test credential).
  3. Admin user creation form had `placeholder="Password"` without `autoComplete="new-password"` and `placeholder="Email"` without `autoComplete="email"`.
  4. RBAC permission fields contained `ads:write` (exposing internal non-canonical permissions).
  5. Campaign monetization modal contained `placeholder="https://partner.com"` (real external domain).
  6. Business registration form contained `contact@yourbusiness.com` instead of RFC 2606 `example.com`.

---

## Part II: Root Cause Report (Phase 2)

1. **Root Causes:**
   - Sitemap API URL composition used naive string concatenation with hardcoded `?limit=...`, breaking queries that already had `?listingType=...`.
   - Inverted regex match condition in `sitemap.ts` eliminated all spare part listing URLs.
   - Sitemap emitted raw category alias strings (`mobile-phones`) that 301-redirect to canonical category slugs (`mobiles`).
   - Admin subdomain (`admin.esparex.in`) had zero search crawler exclusion headers or robots file.
   - Absence of `Organization` schema on homepage and missing `siteName` in root OpenGraph metadata weakened Google's brand entity recognition, allowing spellcheck algorithms to conflate "esparex" with "sparex".
2. **Contributing Causes:**
   - Absence of www-to-non-www 301 normalization in middleware.
   - Incomplete private route disallow list in `apps/web/src/app/robots.ts`.
   - Dangerous `http://localhost:3000` fallback in `metadataBase`.
3. **Pages That SHOULD Be Indexed:**
   - `https://esparex.in/` (Homepage)
   - `https://esparex.in/about`, `/contact`, `/faq`, `/terms`, `/privacy`, `/safety-tips`, `/how-it-works`, `/site-map`
   - `https://esparex.in/search` (Bare search without filters)
   - `https://esparex.in/category/{canonicalSlug}` (7 canonical categories)
   - `https://esparex.in/ads/{slug}-{id}` (Live ads)
   - `https://esparex.in/services/{slug}-{id}` (Live services)
   - `https://esparex.in/spare-part-listings/{slug}-{id}` (Live spare parts)
   - `https://esparex.in/business/{slug}-{id}` (Active verified businesses)
   - `https://esparex.in/seller/{slug}-{id}` (Active sellers)
   - `https://esparex.in/{brands|models}/{slug}-{id}` (Valid catalog landings)
4. **Pages That SHOULD NOT Be Indexed:**
   - All routes under `admin.esparex.in`
   - All authenticated routes (`/account/*`, `/chat/*`, `/post-*`, `/edit-*`, `/business/edit`)
   - Internal revalidation endpoints (`/internal/*`) and APIs (`/api/*`)
   - Parameterized filter queries (`/search?*`)
   - Inactive, pending, deleted, or rejected listings
   - Legacy redirect paths (`/browse-services`, `/browse-spare-parts`, `/spare-parts/*`)
5. **Exact Files Requiring Changes:**
   - `apps/web/src/lib/seo/canonicalHost.ts` (New: centralized canonical host SSOT)
   - `apps/web/src/lib/seo/schemaBuilders.ts` (Add `buildOrganizationSchema`, `buildWebSiteSchema`)
   - `apps/web/src/proxy.ts` (Add www-to-apex 301 redirect and host normalization)
   - `apps/web/src/app/layout.tsx` (MetadataBase, siteName, applicationName, default title)
   - `apps/web/src/app/robots.ts` (Comprehensive private disallow rules)
   - `apps/web/src/app/sitemap.ts` (Query builder, spare parts filter, canonical categories, live listings)
   - `apps/web/src/app/(public)/page.tsx` (Homepage JSON-LD `@graph` with Organization + WebSite)
   - `apps/web/src/app/(public)/search/page.tsx` (Bare `/search` canonicalization)
   - `apps/web/src/components/catalog/CatalogSlugPage.tsx` & `CatalogSlugRoutes.tsx` (Add canonicals and noindex fallbacks)
   - `apps/admin/src/app/robots.ts` (New: Disallow all)
   - `apps/admin/src/app/layout.tsx` (Noindex metadata)
   - `apps/admin/next.config.mjs` (X-Robots-Tag headers)
   - Placeholders: `apps/admin/src/app/login/page.tsx`, `AdminUserFormCard.tsx`, `admin-users/page.tsx`, `CampaignEditModal.tsx`, `PersonalProfileEmailSection.tsx`, `StepBasicDetails.tsx`
6. **Required Tests & Verification:**
   - Unit & regression suite in `apps/web/src/__tests__/seo-sitemap.spec.ts`
   - Automated CLI validation in `apps/web/scripts/validate-sitemap.cjs`
   - Monorepo type-check (`npm run type-check`)
   - Production builds for `apps/web` and `apps/admin`
   - Architecture and route collision guards.
