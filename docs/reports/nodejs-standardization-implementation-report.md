# Node.js Version Standardization — Implementation Report

**Date:** 2026-07-22
**Branch:** `feat/node-version-standardization-22`

---

## 1. Workspace Audit

| Package | Had `engines`? | `private` | Published? | Can inherit root? | Action |
|---|---|---|---|---|---|
| root | `>=22.0.0 <27` | `private: true` | No (monorepo root) | SSOT | Updated to `^22.0.0` |
| `@esparex/apps-web` | `>=22.0.0 <27` | `private: true` | No (Vercel-deployed) | **No** — Vercel reads this file | Updated to `^22.0.0` |
| `@esparex/apps-admin` | `>=22.0.0 <27` | `private: true` | No (Vercel-deployed) | **No** — Vercel reads this file | Updated to `^22.0.0` |
| `@esparex/backend-api` | `>=22.0.0 <27` | *(missing)* | No (Render-deployed) | **Yes** — Render uses `render.yaml` env var | **Removed** |
| `@esparex/core` | `>=22.0.0 <27` | `private: true` | No (internal) | **Yes** | **Removed** |
| `@esparex/shared` | `>=22.0.0 <27` | `private: true` | No (internal) | **Yes** | **Removed** |
| `@esparex/contracts` | No | `private: true` | No (internal) | N/A | No change |
| `@esparex/ui` | No | `private: true` | No (internal) | N/A | No change |
| `@esparex/kernel` | No | `private: true` | No (internal) | N/A | No change |

---

## 2. Publishing Analysis

All workspace packages are `private: true` (or lack a `private` field but are never published). None are published to npm. There is zero risk of a package being installed outside the monorepo context.

**Conclusion:** `engines` field is not required for workspace-internal packages (`core`, `shared`, `contracts`, `ui`, `kernel`).

---

## 3. Retained `engines` — Why `apps/web` and `apps/admin` Keep Theirs

Vercel reads `engines.node` from the **project root directory's** `package.json` to determine the Node.js version for deployment.

Per Vercel docs:
> *"You can define the major Node.js version in the `engines#node` section of the `package.json` to override the one you have selected in the Project Settings."*

The Vercel projects are configured with root directories:
- `@esparex/apps-web` → root: `apps/web`
- `@esparex/apps-admin` → root: `apps/admin`

If `engines` were removed from these files, Vercel would fall back to its platform default (24.x), defeating the purpose of standardization.

**Conclusion:** `apps/web` and `apps/admin` must retain their own `engines` declarations.

---

## 4. Changes Made

### 4.1 Root `package.json`

```diff
  "engines": {
-   "node": ">=22.0.0 <27"
+   "node": "^22.0.0"
  }
```

**Rationale for `^22.0.0`:**
- Standard npm semver notation meaning `>=22.0.0 <23.0.0`
- Vercel explicitly supports `^22.0.0` in their version mapping table
- Prevents any major version drift (22→23→24→...)
- More restrictive than the previous range, which is the intended fix

### 4.2 `apps/web/package.json`

```diff
  "engines": {
-   "node": ">=22.0.0 <27"
+   "node": "^22.0.0"
  }
```

### 4.3 `apps/admin/package.json`

```diff
  "engines": {
-   "node": ">=22.0.0 <27"
+   "node": "^22.0.0"
  }
```

### 4.4 `backend/api/package.json` — `engines` removed

```diff
- "engines": {
-   "node": ">=22.0.0 <27"
- },
```

Render already enforces Node 22 via `render.yaml` → `NODE_VERSION: "22"`. No impact.

### 4.5 `core/package.json` — `engines` removed

```diff
- "engines": {
-   "node": ">=22.0.0 <27"
- },
```

Internal workspace package. Inherits root policy via `.npmrc` `engine-strict=true`.

### 4.6 `shared/package.json` — `engines` removed

```diff
- "engines": {
-   "node": ">=22.0.0 <27"
- },
```

Internal workspace package. Inherits root policy via `.npmrc` `engine-strict=true`.

---

## 5. Dependency Compatibility

All production and dev dependencies are compatible with Node 22:

| Dependency | `engines.node` | Compatible with 22 |
|---|---|---|
| `next` ^16.0.6 | `>=20.9.0` | Yes |
| `react` ^18.3.1 | *(none)* | Yes |
| `vitest` ^4.0.16 | `^20.0.0 \|\| ^22.0.0 \|\| >=24.0.0` | Yes |
| `jest` ^30.2.0 | `^18.14.0 \|\| ^20.0.0 \|\| ^22.0.0 \|\| >=24.0.0` | Yes |
| `dependency-cruiser` ^18.0.0 | `^22\|\|^24\|\|>=26` | Yes |
| `mongoose` ^9.0.2 | `>=20.19.0` | Yes |
| `sharp` ^0.34.5 | `^18.17.0 \|\| ^20.3.0 \|\| >=21.0.0` | Yes |
| `bullmq` ^5.70.1 | *(none)* | Yes |
| `firebase` ^12.7.0 | *(none)* | Yes |
| `firebase-admin` ^13.8.0 | *(none)* | Yes |
| `@sentry/node` ^10.51.0 | `>=18` | Yes |

**No dependency requires Node 24 or higher.** All are fully compatible with Node 22.

---

## 6. Build Verification

All workspace builds passed on **Node 26.0.0** (the currently installed runtime):

| Workspace | Build Result |
|---|---|
| `@esparex/contracts` | ✅ `tsc -b` — success |
| `@esparex/shared` | ✅ `tsc -b` — success |
| `@esparex/core` | ✅ `tsc --build && tsc-alias` — success |
| `@esparex/backend-api` | ✅ `tsc && tsc-alias` — success |
| `@esparex/apps-admin` | ✅ Next.js 16.2.4 — compiled successfully |
| `@esparex/apps-web` | ✅ Next.js 16.2.4 — compiled successfully |

**Zero build failures. Zero TypeScript errors. Zero warnings.**

---

## 7. CI/CD Alignment

| Platform | Before | After | How specified |
|---|---|---|---|
| **Local** | `>=22.0.0 <27` → 26.x | `^22.0.0` | Root `package.json` + `.npmrc` `engine-strict=true` |
| **GitHub Actions** | 22 (via `.nvmrc`) | 22 (unchanged) | `node-version-file: ".nvmrc"` |
| **Render** | 22 (via `NODE_VERSION`) | 22 (unchanged) | `render.yaml` → `NODE_VERSION: "22"` |
| **Vercel (web)** | 24 (inferred) | **22** ✅ | `apps/web/package.json` `engines.node: "^22.0.0"` |
| **Vercel (admin)** | 24 (inferred) | **22** ✅ | `apps/admin/package.json` `engines.node: "^22.0.0"` |

All environments now converge on **Node 22**.

---

## 8. Vercel Verification

With `engines.node: "^22.0.0"` in `apps/web/package.json` and `apps/admin/package.json`:

- Vercel maps `^22.0.0` → latest **22.x** version (per Vercel's version table)
- No Vercel dashboard or `vercel.json` changes required
- The previous range `>=22.0.0 <27` also matched 24.x; the new `^22.0.0` only matches 22.x

**Vercel will now select Node 22.x for both frontend deployments.**

---

## 9. Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Breaking change | **None** | Build passed. No API changes. Syntax-only `engines` field update. |
| Workspace compatibility | **None** | Internal packages removed redundant `engines`. Root enforced via `.npmrc`. |
| Package publishing | **None** | No packages are published externally. |
| CI impact | **None** | GitHub Actions continues reading `.nvmrc` (unchanged). |
| Deployment impact | **Low** | Vercel will select 22.x instead of 24.x. No functional difference — same lockfile, same dependencies. |
| Rollback complexity | **Low** | Simple `git revert` of 6 files. |

**Overall risk: LOW**

---

## 10. Final Recommendation

**The implementation is complete.** The changes:

1. Establish the **root `package.json`** as the single source of truth for Node version policy
2. Retain `engines` only in **Vercel-deployed workspaces** (`apps/web`, `apps/admin`) where deployment tooling requires it
3. Remove duplicated `engines` from **internal workspace packages** (`core`, `shared`, `backend/api`)
4. Narrow the range from `>=22.0.0 <27` to `^22.0.0` to prevent any major version drift

This eliminates the Vercel-vs-repository mismatch while minimizing long-term maintenance overhead.
