# Phase 10: Admin Audit Report

## 1. Executive Summary
An admin portal audit of the `@esparex/apps-admin` workspace was conducted. The application is a Next.js admin dashboard used by platform operators to perform ad moderation, business account approval, transaction auditing, and system config overrides. The audit identified a critical security issue where the admin cookie-checking session gate (`proxy.ts`) is completely inactive and bypassed because there is no `middleware.ts` file registered to execute it.

---

## 2. Scope
This audit evaluated:
- Next.js routing structure in `apps/admin/src/app/`
- Session cookie authentication gates and route protection
- Redirect configurations in `next.config.mjs`
- Committed testing files and build caches

---

## 3. Inventory

### Core Page Routes (Next.js App Router)
- **Public**:
  - `/login` — Administrator credential authentication panel
- **Protected Group `(protected)`**:
  - `/ads` — Moderation listing feed (approvals, flags, rejects)
  - `/businesses` & `/business-requests` — Enterprise dealer approval forms
  - `/chat` — Moderated customer support threads
  - `/reports` — Moderation review queue for flagged ads
  - `/services` & `/spare-parts` — System catalog taxonomy editors
  - `/(catalog)` — Taxonomy node mapping (brands, categories, models)
  - `/(finance)` — Transaction charts & invoicing forms
  - `/(system)` — System config overrides, cache purges, and server health logs

---

## 4. Findings

### Critical Severity Findings
1. **Bypassed Session Authentication Gate Middleware**
   - **Finding**: The file `apps/admin/src/proxy.ts` implements the server-side authentication redirect flow. It checks for the existence of `admin_token` cookie and redirects unauthenticated users to `/login`. However, there is no `middleware.ts` (or `middleware.js`) file present at the root or `src/` levels of the `apps/admin` workspace.
   - **Impact**: Next.js completely ignores `proxy.ts`. There is no server-side middleware running to gate routes, meaning unauthenticated requests are not blocked at the server ingress level, exposing routes to client-side-only protection.

---

### High Severity Findings
2. **Committed Test Image in Source**
   - **Finding**: A test asset `apps/admin/test.png` (7.6 KB) is committed directly to the admin workspace root.
   - **Impact**: Contaminates repository hygiene and should be removed.

---

### Medium Severity Findings
3. **Redundant Redirection Mappings**
   - **Finding**: `apps/admin/next.config.mjs` contains multiple similar/redundant redirect rules (e.g. mapping `/moderation` and `/moderation/ads` to the exact same `/ads?status=pending` path).
   - **Impact**: Clutters the Next.js configurations.

---

## 5. Evidence

### Missing Middleware configuration
Files inside `apps/admin/src/`:
- `app/` (Next.js App Router)
- `components/`
- `context/`
- `hooks/`
- `lib/`
- `proxy.ts` (helper)
- `schemas/`
- `styles/`
- `types/`
*(No `middleware.ts` exists to import and call `proxy.ts`).*

### Committed Test Image Path
- [apps/admin/test.png](file:///c:/Users/Administrator/Documents/GitHub/Esparex/apps/admin/test.png)

---

## 6. Risk Level
- **Overall Admin Risk**: **Critical**
- Bypassing the server-side authentication middleware exposes admin dashboard layouts to potential access bypass vectors.

---

## 7. Recommendations
1. **Activate Middleware**: Create a standard `apps/admin/src/middleware.ts` that exports the `proxy` function from `./proxy` as default:
   ```typescript
   export { proxy as default } from './proxy';
   ```
2. **Remove Committed Test Image**: Delete `apps/admin/test.png` from git tracking using `git rm`.
3. **Consolidate Redirects**: Simplify the redirection entries inside `next.config.mjs`.

---

## 8. Out-of-Scope Items
- Live REST endpoint checks (covered under API/Infrastructure audits).

---

## 9. Next Steps
- Update Dashboard Status.
- Proceed to **Phase 11 — Shared Package Audit**.
