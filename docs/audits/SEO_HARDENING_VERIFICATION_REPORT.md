# SEO Indexing, Canonicalization & Placeholder Hardening Verification Report

- **Date**: 2026-09-04
- **Branch**: `fix/seo-indexing-auth-hardening`
- **Target Environments**: Web (`https://esparex.in`), Admin (`https://admin.esparex.in`)

---

## 1. Summary of Changes & Root Causes Addressed

| Issue / Category | Root Cause | Solution Implemented | Verification Status |
|---|---|---|---|
| **BUG-1: Sitemap Query Parameter Double-Separator** | `${url}?limit=1000&page=1` appended to `listings?listingType=ad` created `...ad?limit=1000&page=1` | Added `buildSitemapApiUrl` using `URL` and `URLSearchParams` to safely set query parameters | ✅ Verified (18/18 vitest tests pass) |
| **BUG-2: Spare Parts Sitemap Filter Inversion** | `!part.slug.match(...) === false` evaluated boolean comparison incorrectly, excluding 100% of spare parts | Replaced with `Boolean(part.id && (!part.slug \|\| /^[a-z0-9-]+$/.test(part.slug)))` | ✅ Verified in vitest suite |
| **BUG-3: Admin Indexation Exposure** | Admin application had no `robots.ts`, no `noindex` metadata, and no `X-Robots-Tag` | 1. Created `apps/admin/src/app/robots.ts` (`Disallow: /`)<br>2. Added `robots: { index: false, follow: false, nocache: true }` in `layout.tsx`<br>3. Configured `X-Robots-Tag: noindex, nofollow, noarchive` in `next.config.mjs` | ✅ Verified (`/robots.txt` built, config compiled) |
| **BUG-4: Localhost Fallback in MetadataBase** | `metadataBase` in `apps/web/src/app/layout.tsx` defaulted to `http://localhost:3000` | Fallback set to canonical `https://esparex.in` and validated against admin/staging/preview/localhost leaks | ✅ Verified |
| **BUG-5: Incomplete Private Disallows in robots.txt** | Missing disallows for `/chat/`, `/post-spare-part-listing`, `/edit-service/`, `/edit-spare-part/`, `/internal/` | Added comprehensive disallow list covering all authenticated and internal routes | ✅ Verified in vitest & robots check |
| **BUG-6, BUG-7, BUG-8: Spare Part Endpoint & Canonical Format** | Sitemap fetched catalog parts rather than listings and emitted bare slug instead of `${slug}-${id}` | Fetched `listings?listingType=spare_part&status=live` and generated `${slug}-${id}` canonical URLs | ✅ Verified in vitest suite |
| **Category Alias 301 Redirects in Sitemap** | Sitemap emitted `/category/mobile-phones` which redirects to `/category/mobiles` | Passed all category tokens through `getCanonicalCategorySlug` to ensure zero redirect entries in sitemap | ✅ Verified in vitest suite |
| **P1–P7: Sensitive Form Placeholders** | Login exposed `admin@esparex.com`, `000000`, missing `autoComplete`, and external domains like `partner.com` | Replaced all instances with generic, RFC-compliant text and added missing `autoComplete` attributes | ✅ Verified |

---

## 2. Automated Test Results

### 2.1 Unit & Regression Suite (`apps/web/src/__tests__/seo-sitemap.spec.ts`)
- **Suite Result**: 18 / 18 tests passed
- **Coverage**:
  - `sanitiseSlug`: special characters, parentheses, multi-dash stripping
  - `buildSitemapApiUrl`: query parameter safety, no double `?`, boundary slashes
  - `formatSitemapDate`: W3C ISO date formatting without milliseconds
  - Sitemap static route inventory (only canonical public URLs)
  - Sitemap exclusion of redirect routes (`/browse-services`, `/browse-spare-parts`, `/spare-parts/`)
  - Sitemap exclusion of private routes (`/account/`, `/chat`, `/post-`, `/edit-`, `/internal/`, `/api/`)
  - Verification of zero admin, localhost, or preview hostnames
  - Spare part listing format `${slug}-${id}` and filter preservation
  - Canonical category slugs (no redirect aliases)
  - Zero duplicate URLs
  - Web `robots.txt` policy verification
  - Sensitive placeholder security assertions

### 2.2 Monorepo Type Check
- **Command**: `npm run type-check`
- **Workspaces Audited**:
  - `@esparex/design-tokens`
  - `@esparex/contracts`
  - `@esparex/shared`
  - `@esparex/core`
  - `@esparex/backend-api`
  - `@esparex/apps-admin`
  - `@esparex/apps-web`
  - `@esparex/mobile-ui`
  - `@esparex/apps-mobile`
- **Result**: Exit code 0, 0 errors across all 9 packages.

### 2.3 Production Builds
- `npm run build -w apps/admin`: Compiled and optimized successfully (Exit code 0)
- `npm run build -w apps/web`: 41 routes static & dynamic optimized successfully (Exit code 0)

### 2.4 Automated SEO Tooling (`apps/web/scripts/validate-sitemap.cjs`)
- **Command**: `npm run ci:seo -w apps/web`
- **Result**: Static source SEO rules audit: PASSED with 0 violations.

### 2.5 Monorepo Architecture & Route Guards
- `npm run guard:mobile-architecture`: Passed
- `node scripts/enforce-route-collision-guard.js`: Passed
- `node scripts/guard-route-shadowing.js`: Passed
- `node scripts/enforce-shared-ssot.js`: Passed
- `node scripts/enforce-design-token-adoption.js`: Passed (0 violations)

---

## 3. Pre-PR Git Hygiene & Clean Status

- `git diff origin/develop...HEAD --check`: Clean (0 whitespace/conflict errors)
- `git status`: Working tree clean
- Sequential clean commit history on single branch `fix/seo-indexing-auth-hardening`.
