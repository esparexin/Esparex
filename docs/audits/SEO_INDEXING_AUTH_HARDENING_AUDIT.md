# SEO Indexing, Canonicalization & Sensitive Placeholder Hardening Audit

## Executive Summary

- **Audit Date**: 2026-09-04
- **Branch**: `fix/seo-indexing-auth-hardening`
- **Target Apps**: `apps/web` (Next.js 15, `https://esparex.in`), `apps/admin` (Next.js 15, `https://admin.esparex.in`)
- **Scope**: SEO, indexing, canonicalization, robots.txt, sitemap.xml, sensitive placeholder text, form credentials.

---

## 1. Google Search Console & Route Inventory Baseline

### 1.1 GSC Baseline Profile (Current State)
- **Total Discovered URLs**: ~109 URLs
- **Indexed**: 23 URLs
- **Not Indexed**: 86 URLs across 7 reason categories
- **Objective**: Ensure ONLY genuine, public, unique, canonical, indexable pages on `https://esparex.in` are indexed. Explicitly prevent indexing for admin, private, internal, redirect-only, filter-parameterized, and non-live pages.

### 1.2 Route Audit & Classification

| Route Pattern | Classification | Current Indexability | Target Indexability | Action Required |
|---|---|---|---|---|
| `/` | Static Public | Indexable | Indexable | Canonical verification |
| `/about`, `/contact`, `/faq`, `/how-it-works`, `/privacy`, `/safety-tips`, `/site-map`, `/terms` | Static Public | Indexable | Indexable | Retain in sitemap |
| `/search` (bare) | Search Public | Indexable | Indexable | Canonical verification |
| `/search?*` (with filters) | Search Query | `noindex` | `noindex` | Retain `hasFilters` -> `noindex` |
| `/ads/[slug]` | Dynamic Listing | Indexable if live | Indexable if live | Fix sitemap endpoint & query param bug |
| `/services/[slug]` | Dynamic Listing | Indexable if live | Indexable if live | Fix sitemap endpoint & query param bug |
| `/spare-part-listings/[slug]` | Dynamic Listing | Indexable if live | Indexable if live | Fix sitemap filter bug, URL format (`slug-id`), and endpoint |
| `/business/[slug]` | Dynamic Business | Indexable | Indexable | Retain in sitemap |
| `/seller/[id]` | Dynamic Seller | Indexable | Indexable | Validate canonical format |
| `/category/[category]` | Dynamic Taxonomy | Indexable | Indexable | Retain canonical category slugs |
| `/brands/[slug]`, `/models/[slug]` | Dynamic Taxonomy | Indexable | Indexable if content exists | Verify canonical metadata |
| `/browse-services`, `/browse-spare-parts` | Legacy Redirect | 301 Redirect | 301 (Do NOT Index) | Exclude from sitemap |
| `/spare-parts/[slug]` | Legacy Redirect | 301 Redirect | 301 (Do NOT Index) | Exclude from sitemap |
| `/account/*` | Private Auth | `noindex` | `noindex` | Verify robots.txt disallow |
| `/chat/*` | Private Auth | `noindex` (layout) | `noindex` | **Add to robots.txt disallow** |
| `/post-ad`, `/post-service`, `/post-spare-part-listing` | Private Auth | `noindex` (layout) | `noindex` | Verify robots.txt disallow |
| `/edit-ad/*`, `/edit-service/*`, `/edit-spare-part/*` | Private Auth | `noindex` (layout) | `noindex` | **Add to robots.txt disallow** |
| `/business/edit` | Private Auth | `noindex` (layout) | `noindex` | **Add to robots.txt disallow** |
| `/internal/*` | System/API | Accessible | `noindex` | **Add to robots.txt disallow** |
| `admin.esparex.in/*` | Admin Subdomain | **Publicly indexable** | **NOINDEX ALL** | **Add admin robots.ts, layout metadata, and X-Robots-Tag header** |

---

## 2. Root Cause Analysis of Identified Bugs

### BUG-1: Sitemap Query Parameter Double-Separator (CRITICAL)
- **Location**: `apps/web/src/app/sitemap.ts` (lines 51, 95, 97)
- **Root Cause**: `fetchDynamicIds` takes `endpoint` (passed as `"listings?listingType=ad"`) and string-interpolates `${url}?limit=1000&page=1`, creating `.../listings?listingType=ad?limit=1000&page=1` (double `?`).
- **Consequence**: Backend fails to parse `listingType` or treats it as malformed, mixing or failing dynamic listing retrieval.
- **Fix**: Use `URL` or `URLSearchParams` to safely append query parameters without string concatenation collisions.

### BUG-2: Spare Parts Filter Inversion (CRITICAL)
- **Location**: `apps/web/src/app/sitemap.ts` (line 158)
- **Root Cause**: `.filter((part) => part.slug && !part.slug.match(/^[a-z0-9-]+$/) === false)`. Precedence causes `!part.slug.match(...)` to evaluate to boolean, which is never strictly equal to `false` when match succeeds.
- **Consequence**: Exactly 0 spare part listing URLs are output in sitemap.xml.
- **Fix**: Use regex test: `.filter((part) => Boolean(part.slug && /^[a-z0-9-]+$/.test(part.slug)))`.

### BUG-3: Admin Application Indexing Vulnerability (HIGH)
- **Location**: `apps/admin/src/app/` (all routes, `layout.tsx`, `next.config.mjs`)
- **Root Cause**: No `robots.ts`, no `robots: { index: false, follow: false }` metadata in root layout, and no `X-Robots-Tag: noindex, nofollow, noarchive` HTTP response headers configured.
- **Consequence**: `admin.esparex.in/login` and administrative routes risk indexation in Google Search Console.
- **Fix**: Implement defense-in-depth:
  1. `apps/admin/src/app/robots.ts` with `Disallow: /`.
  2. Root layout metadata `robots: { index: false, follow: false, nocache: true }`.
  3. `X-Robots-Tag: noindex, nofollow, noarchive` HTTP header in `apps/admin/next.config.mjs`.

### BUG-4: Dangerous `localhost:3000` MetadataBase Fallback (HIGH)
- **Location**: `apps/web/src/app/layout.tsx` (lines 15–26)
- **Root Cause**: Fallback URL is `http://localhost:3000` if `process.env.NEXT_PUBLIC_APP_URL` is undefined.
- **Consequence**: Any relative canonical or OpenGraph image path resolves to `http://localhost:3000/...` in production, causing search crawler confusion and canonical rejection.
- **Fix**: Set fallback to canonical production origin `https://esparex.in`.

### BUG-5: Incomplete Private Disallow Rules in `robots.ts` (MEDIUM)
- **Location**: `apps/web/src/app/robots.ts`
- **Root Cause**: Missing disallows for `/chat/`, `/edit-service/`, `/edit-spare-part/`, `/post-spare-part-listing`, `/business/edit`, `/internal/`.
- **Consequence**: Crawlers attempt crawling private interactive pages before hitting layout tags or auth gates.
- **Fix**: Expand disallow paths in `robots.ts`.

### BUG-6 & BUG-7: Spare Parts Endpoint & Canonical Route Mismatch (MEDIUM)
- **Location**: `apps/web/src/app/sitemap.ts`
- **Root Cause**: Sitemap fetches `catalog/spare-parts` (catalog taxonomy) instead of user-posted listings `listings?listingType=spare_part`, and outputs `/spare-part-listings/${slug}` instead of the canonical `${slug}-${id}` format.
- **Consequence**: Sitemap entries do not match live detail page canonicals, triggering redirect errors in GSC.
- **Fix**: Query `listings?listingType=spare_part` and format URLs with `${slug}-${id}`.

---

## 3. Sensitive Placeholder Audit Baseline

| Issue | File | Current Placeholder / Text | Security / UX Concern | Target Replacement |
|---|---|---|---|---|
| ISSUE-P1 | `apps/admin/src/app/login/page.tsx:191` | `placeholder="admin@esparex.com"` | Exposes corporate email domain pattern; enumeration hint | `placeholder="Your admin email address"` |
| ISSUE-P2 | `apps/admin/src/app/login/page.tsx:255` | `placeholder="000000"` | Mimics default OTP / credential | `placeholder="6-digit code"` |
| ISSUE-P3 | `AdminUserFormCard.tsx:184` | `placeholder="Password"` | Duplicates label, lacks `autoComplete` | `placeholder="Set initial password"`, `autoComplete="new-password"` |
| ISSUE-P4 | `AdminUserFormCard.tsx:171` | `placeholder="Email"` | Duplicates label, lacks `autoComplete` | `placeholder="Admin email address"`, `autoComplete="email"` |
| ISSUE-P5 | `admin-users/page.tsx:114,286` | `ads:write`, `Permissions... (example: users:read, ads:write)` | Exposes internal scope vocabulary; uses deprecated non-canonical `ads` term | `e.g. users:read, listings:write` |
| ISSUE-P6 | `CampaignEditModal.tsx:144,176` | `e.g. 1234567890`, `https://partner.com` | Real external domain `partner.com`; unguided slot ID | `Google AdSense slot ID`, `https://advertiser.example.com` |
| ISSUE-P7 | `PersonalProfileEmailSection.tsx:26` | `placeholder="name@company.com"` | Implies corporate email on personal account profile | `placeholder="your@email.com"` |

---

## 4. Verification Baseline

Before applying fixes, the following checks will be executed across all phases:
1. `npm run type-check` (Monorepo type check)
2. `npm run build -w apps/web`
3. `npm run build -w apps/admin`
4. Automated unit and regression tests for sitemap and canonical generation.
