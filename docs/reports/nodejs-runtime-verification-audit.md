# Node.js Runtime Verification Audit: Vercel (24.x) vs Repository (22.x)

**Date:** 2026-07-22
**Scope:** Root cause analysis of Node.js version mismatch between Vercel (24.x) and repository configuration (22.x)

---

## 1. All `engines.node` Declarations

| File | `engines.node` Value | Notes |
|---|---|---|
| `package.json` (root) | `>=22.0.0 <27` | Range permits 22, 23, 24, 25, 26 |
| `apps/web/package.json` | `>=22.0.0 <27` | Matches root |
| `apps/admin/package.json` | `>=22.0.0 <27` | Matches root |
| `backend/api/package.json` | `>=22.0.0 <27` | Matches root |
| `core/package.json` | `>=22.0.0 <27` | Matches root |
| `shared/package.json` | `>=22.0.0 <27` | Matches root |
| `packages/contracts/package.json` | *(none)* | No `engines` field |
| `packages/ui/package.json` | *(none)* | No `engines` field |
| `packages/kernel/package.json` | *(none)* | No `engines` field |

**All declared engines are consistent.** No conflicts exist. Every engine is `>=22.0.0 <27`.

---

## 2. All Node.js Version Declarations

| Location | Version | Source |
|---|---|---|
| Root `package.json` | `>=22.0.0 <27` | `engines.node` |
| `apps/web/package.json` | `>=22.0.0 <27` | `engines.node` |
| `apps/admin/package.json` | `>=22.0.0 <27` | `engines.node` |
| `backend/api/package.json` | `>=22.0.0 <27` | `engines.node` |
| `core/package.json` | `>=22.0.0 <27` | `engines.node` |
| `shared/package.json` | `>=22.0.0 <27` | `engines.node` |
| `.nvmrc` | `22` | Pinned to major version 22 |
| `README.md` | `22.x` | Documentation section "Setup" |
| GitHub Actions (`ci.yml`) | `22` (via `.nvmrc`) | `node-version-file: ".nvmrc"` |
| GitHub Actions (`release.yml`) | `22` (via `.nvmrc`) | `node-version-file: ".nvmrc"` |
| Render (`render.yaml`) | `22` | `NODE_VERSION: "22"` env var |
| Vercel (`vercel.json`) | *(not specified)* | No Node version in config |
| Local tooling (`engine-strict=true`) | enforced via `.npmrc` | Blocks installs outside `>=22.0.0 <27` |

---

## 3. Why Vercel Uses Node 24.x — Root Cause

**Root cause is the `engines.node` range `>=22.0.0 <27`.**

Vercel's Node.js version selection logic (per [Vercel docs](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)):

1. If `engines.node` is set in `package.json`, Vercel maps the semver range to the **highest available major version** that satisfies the range.
2. As of February 2026, Vercel's available versions are **24.x** (default), **22.x**, **20.x**.
3. The range `>=22.0.0 <27` matches both **22.x** and **24.x**.
4. Vercel selects **24.x** (the highest matching version).

**There is no Production Override, no Project Setting override, and no vercel.json override.** The `vercel.json` files at `apps/web/vercel.json` and `apps/admin/vercel.json` do not specify any Node.js version. Vercel's behavior is correct given the current `engines.node` configuration.

The `.npmrc` has `engine-strict=true`, which causes `npm ci` to verify the Node version. Since 24.x falls within `>=22.0.0 <27`, the install passes without error, silently confirming 24.x as valid.

---

## 4. Build Compatibility Results

### Local environment (Node 26.0.0)

The current local machine runs Node 26.0.0 with `npm@11.12.1`.

**Key dependency compatibility:**

| Dependency | Version | `engines.node` | Compatible with 22 | Compatible with 24 |
|---|---|---|---|---|
| `next` | ^16.0.6 | `>=20.9.0` | Yes | Yes |
| `vitest` | ^4.0.16 | `^20.0.0 \|\| ^22.0.0 \|\| >=24.0.0` | Yes | Yes |
| `dependency-cruiser` | ^18.0.0 | `^22\|\|^24\|\|>=26` | Yes | Yes |
| `sharp` | ^0.34.5 | `^18.17.0 \|\| ^20.3.0 \|\| >=21.0.0` | Yes | Yes |
| `mongoose` | ^9.0.2 | `>=20.19.0` | Yes | Yes |
| `@sentry/node` | ^10.51.0 | `>=18` | Yes | Yes |
| `@sentry/profiling-node` | ^10.51.0 | `>=18` | Yes | Yes |
| `jest` (in backend) | ^30.2.0 | `^18.14.0 \|\| ^20.0.0 \|\| ^22.0.0 \|\| >=24.0.0` | Yes | Yes |
| `knip` (dev) | ^6.26.0 | *(not checked)* | — | — |
| `tsx` (dev) | ^4.23.1 | `>=18.0.0` | Yes | Yes |

**No dependency requires Node 24 specifically.** All dependencies with engines constraints are compatible with both Node 22 and Node 24.

**No dependency forces Vercel onto Node 24.** The selection is purely a function of the `engines.node` range being too permissive.

**Note regarding `@types/node`:** `apps/web` and `apps/admin` use `@types/node@^24.10.1`, while `backend/api` and `core` use `@types/node@^25.1.0`. These are TypeScript type declarations and do not affect the runtime Node.js version. However, they indicate the type-checking target is Node 24-25 APIs, which may reference APIs not available in Node 22.

---

## 5. CI/CD Platform Comparison

| Platform | Node Version | How Specified |
|---|---|---|
| **Local** | 26.0.0 | System-installed |
| **GitHub Actions CI** | **22** | `.nvmrc` → `actions/setup-node@v7 ` |
| **Render (backend API)** | **22** | `render.yaml` → `NODE_VERSION: "22"` |
| **Vercel (web + admin)** | **24** (inferred) | `engines.node` → Vercel selects highest match |

**Inconsistency:** Vercel runs Node 24 while CI, Render, and documented setup all target Node 22.

---

## 6. Risk Assessment — Mixed Versions (Render 22 / Vercel 24)

**Classification: MEDIUM RISK**

Evidence-based risk evaluation:

| Risk Factor | Impact | Details |
|---|---|---|
| **Build inconsistencies** | Medium | Next.js build output on Node 24 may produce different optimized bundles than Node 22. The `sharp` native binary may differ. |
| **Dependency resolution** | Low | `npm ci` resolves the same `package-lock.json` on both versions. No dependency version differences detected. |
| **ESM/CJS behavior** | Medium | Node 24 may have changed ESM interoperability or module resolution behaviors vs Node 22. |
| **Runtime API differences** | Medium | APIs available in Node 24 may not exist in Node 22. `@types/node@^25.1.0` may reference APIs unavailable in Node 22. `structuredClone`, `fetch`, and other APIs differ between versions. |
| **Package manager** | Low | Both use `npm@10.9.7` (specified in root `packageManager`). |
| **Production bugs** | Medium | A bug that manifests only in Node 24 (or only in Node 22) would be missed by CI, since CI runs Node 22 only. |
| **`dependency-cruiser`** | Low | Requires `^22\|\|^24\|\|>=26` — compatible with both, but this tool is the only one that explicitly allows both majors. |

**Key concern:** The `npm run start` for the backend (`NODE_ENV=production node dist/index.js`) runs on Render's Node 22, while the frontend server-side rendering runs on Vercel's Node 24. If isomorphic code behaves differently between versions, production bugs would occur on one platform but not the other.

---

## 7. Recommendation

### Option A — Standardize on Node 22 LTS (RECOMMENDED)

**Rationale:**

1. **Intended target is Node 22.** The `.nvmrc` file says `22`, the README says `Node.js 22.x`, GitHub Actions uses `.nvmrc` (resolving to 22), and Render explicitly sets `NODE_VERSION: "22"`.

2. **The `engines.node` range `>=22.0.0 <27` is overly permissive.** It was likely written to allow minor/patch flexibility within Node 22, but it inadvertently permits Node 24. The correct range for Node 22-only is `^22.0.0` or `>=22.0.0 <23`.

3. **No dependency requires Node 24.** Every dependency is compatible with Node 22.

4. **Consistency reduces risk.** All environments (CI, Render, Vercel, local) would run the same Node version, eliminating the mixed-version risk.

5. **Vercel Node 24 selection is not an explicit choice.** It is a side effect of Vercel's "highest matching version" algorithm combining with an overly broad `engines.node` range.

### Required action

Change `engines.node` in all 6 `package.json` files from `>=22.0.0 <27` to `^22.0.0`:

- `package.json` (root)
- `apps/web/package.json`
- `apps/admin/package.json`
- `backend/api/package.json`
- `core/package.json`
- `shared/package.json`

This will cause Vercel to select Node 22.x instead of 24.x, because `^22.0.0` resolves to the highest available 22.x version, and Vercel's version table maps `22.x` → latest 22.x.

**Vercel-side:** No `vercel.json` changes needed. The `engines.node` change alone will switch Vercel to Node 22.

### Option B — Standardize on Node 24

Not recommended because:
- `.nvmrc`, README, CI, and Render are all configured for Node 22
- No dependency requires Node 24
- Node 24 is not an LTS release; Node 22 is the current LTS

### Option C — Keep mixed versions

Not recommended because:
- The mismatch is unintentional (caused by permissive range, not deliberate design)
- Medium risk of production inconsistencies
- No benefit to running different versions

---

## 8. Summary

| Question | Answer |
|---|---|
| Why is Vercel using Node 24? | `engines.node >=22.0.0 <27` permits 24.x, and Vercel selects the highest matching version |
| Is this correct behavior? | Yes, Vercel's behavior is correct given the configuration |
| Should Render stay on Node 22? | Yes, if the project standardizes on 22; or upgrade to 24 if the project moves to 24 |
| Should GitHub Actions change? | No, they correctly use `.nvmrc` which points to 22 |
| Is there a dependency forcing Node 24? | **No.** All dependencies are compatible with Node 22 |
| Risk level | **Medium** — build inconsistencies, API differences, and undetected production bugs |
| Best fix | Narrow `engines.node` to `^22.0.0` across all workspace `package.json` files |
