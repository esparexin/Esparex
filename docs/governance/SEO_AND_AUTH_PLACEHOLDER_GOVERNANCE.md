# SEO, Indexing & Sensitive Placeholder Governance

> **Status:** Enforced · **Owner:** SEO & Application Security Governance · **Scope:** All web and admin applications across Esparex monorepo.

---

## 1. SEO & Indexing Prevention Rules

To ensure search engines crawl and index only canonical, valuable, and public pages on `https://esparex.in`:

1. **Deterministic Canonical URLs**:
   - All public canonical URLs MUST resolve to `https://esparex.in`.
   - Never generate canonical URLs pointing to `localhost`, `admin.esparex.in`, or preview/staging environments.
   - Dynamic canonical generation must match the canonical route format defined in the application (e.g., `${slug}-${id}` for listings).

2. **Absolute Admin and Private Route Protection**:
   - The entire `admin.esparex.in` application MUST be non-indexable.
   - Enforcement MUST follow defense-in-depth:
     - `robots.ts` with `Disallow: /`
     - Root layout metadata: `robots: { index: false, follow: false, nocache: true }`
     - HTTP Header: `X-Robots-Tag: noindex, nofollow, noarchive`
   - Private and authenticated web routes (`/account/*`, `/chat/*`, `/post-*`, `/edit-*`, `/business/edit`) must never be indexable.
   - Internal API/revalidation endpoints (`/api/*`, `/internal/*`) must be blocked in `robots.ts`.

3. **Sitemap Integrity**:
   - Sitemap URLs MUST exactly match canonical routes.
   - Redirect-only routes (such as `/browse-services`, `/browse-spare-parts`, `/spare-parts/[slug]`) MUST NEVER be included in `sitemap.ts`.
   - Non-live, drafted, rejected, or expired listings MUST NOT be included in `sitemap.ts`.
   - Dynamic query strings must be constructed safely using `URL` or `URLSearchParams`; never manually concatenate queries with string interpolation (`?` vs `&`).
   - All slug filters must use sound boolean logic (e.g. `Boolean(slug && regex.test(slug))`).

4. **Production MetadataBase Security**:
   - `metadataBase` fallbacks must never default to `http://localhost:3000` in production-facing layouts.
   - The fallback must default to `new URL('https://esparex.in')`.

---

## 2. Authentication & Form Placeholder Prevention Rules

To prevent sensitive information exposure, user confusion, and credential enumeration:

1. **No Production or Real Email Domain Patterns**:
   - Placeholders on public and admin authentication forms must NEVER use real company or administrative domains (e.g., avoid `admin@esparex.com`).
   - Use generic, actionable prompt text such as `"Your admin email address"` or `"your@email.com"`.

2. **No Default-Looking Credentials or OTPs**:
   - Authentication fields must never use realistic numbers like `"000000"` or `"123456"`.
   - Use explanatory hints such as `"6-digit code"`.

3. **Safe Example Domains**:
   - When URL examples are required in documentation, inputs, or placeholders, use RFC 2606 reserved domains (`example.com`, `example.org`, `advertiser.example.com`).
   - Never use real commercial partner domains (e.g. avoid `partner.com`).

4. **Credential Autocomplete Attributes**:
   - Password creation fields MUST have `autoComplete="new-password"`.
   - Email inputs MUST have `autoComplete="email"`.
   - Password login fields MUST have `autoComplete="current-password"`.

5. **No Internal Scope Vocabulary Exposure**:
   - Do not leak internal RBAC terminology or obsolete entity names (e.g., do not use `ads:write`; use unified canonical terminology `listings:write`).
   - Placeholders should inform without duplicating label text verbatim.

---

## 3. Code Quality and Monorepo Hygiene Rules

1. **Contracts as Single Source of Truth**:
   - All API DTOs and routes must reference `@esparex/contracts` and `@esparex/shared`.
   - Do not redefine parallel DTOs, listing types, or query params locally.

2. **Zero TypeScript Escape Hatches**:
   - `as any`, `as never`, `as unknown as`, `@ts-ignore`, and `@ts-expect-error` are strictly prohibited in production code.

3. **Zero Dead Code & Orphans**:
   - Remove unused imports, dead variables, deprecated route handlers, and temporary implementation comments.
   - Maintain strict accessibility (WCAG 2.2 AA) and prevent regressions.
