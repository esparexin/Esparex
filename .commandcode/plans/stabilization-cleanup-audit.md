# Repository Stabilization Phase 1 — Cleanup Audit

**Date:** 2026-07-08  
**Owner:** mad-enter-tainer  
**Status:** Audit Only — No Deletions  

---

## PHASE 1 — Repository Discovery

### Monorepo Identity
- **Name:** `esparex-admin-root`  
- **Node:** `>=22.0.0 <23` | **npm:** 10.9.7  
- **Workspaces:** 14 (9 repository-*, 2 apps, 1 backend, 1 core, 1 shared)  
- **CI/CD:** GitHub Actions (11 workflows)  
- **Deploy:** Vercel (frontends) + Render (backend)  

### Workspace Inventory

| Workspace | Path | Purpose | Owner |
|-----------|------|---------|-------|
| `@esparex/apps-admin` | `apps/admin` | Next.js admin dashboard (port 3001) | frontend-team |
| `@esparex/apps-web` | `apps/web` | Next.js public web app (port 3000) | frontend-team |
| `@esparex/backend-user` | `backend/user` | Express API (port 5001) | backend-team |
| `@esparex/core` | `core` | Business logic, models, services, events | backend+arch-team |
| `@esparex/shared` | `shared` | Types, enums, schemas, contracts | backend+frontend-team |
| `packages/repository-*` (9) | `packages/*` | Governance engine stack | platform-team |

### Ownership Map
| Pattern | Owners |
|---------|--------|
| `*` (default) | `@esparex/core-team` |
| `apps/*` | `@esparex/frontend-team` |
| `backend/*` | `@esparex/backend-team` |
| `core/` | `@esparex/backend-team` + `@esparex/architecture-team` |
| `shared/` | `@esparex/backend-team` + `@esparex/frontend-team` |
| `.github/`, `scripts/`, `packages/repository-*`, `docs/governance/` | `@esparex/platform-team` |

---

## PHASE 2 — Cleanup Audit (All Findings)

### 2.1 Dead Code
| ID | Item | Location | Details |
|----|------|----------|---------|
| DC-01 | Unused backend utils | `backend/user/src/utils/` | 11 files never imported (adminBaseController, adminLogHelpers, adminLogger, contentHandler, controllerUtils, deviceFingerprint, errorResponse, health, requestParams, respond, smartAlertHelpers) |
| DC-02 | Orphaned enums | `shared/src/enums/` | `inventoryStatus.ts` and `listingStatus.ts` not exported from `shared/src/index.ts` |
| DC-03 | Unused constants | `shared/src/constants/` | `businessConstants.ts`, `location.ts` (radius constants), `serviceTypes.ts`, `mobileVisibility.ts` — exported but never imported |
| DC-04 | Orphaned schema | `shared/src/schemas/coordinates.schema.ts` | Not exported from `shared/src/index.ts` |
| DC-05 | Empty listeners dir | `core/src/events/listeners/` | Directory exists but appears empty |
| DC-06 | Unused core constants | `core/src/constants/adminPermissions.ts`, `core/src/constants/locationEvents.ts` | Never imported |

### 2.2 Unused Files
| ID | Item | Location | Count |
|----|------|----------|-------|
| UF-01 | Unreferenced scripts | `scripts/` directory | ~45 files (fix-*.js, rewrite-*.js, populate-*.js, evidence-gate-*.js, catalog-*.js, etc.) |
| UF-02 | Cleanup artifacts | `docs/cleanup/` | ~80 timestamped files across 7+ runs |
| UF-03 | Archive bloat | `docs/archive/reports/` | ~40 report files (REFUND series) |
| UF-04 | Legacy audits | `archive/legacy/` | 27 audit phase documents |

### 2.3 Orphan Files
| ID | Item | Location | Details |
|----|------|----------|---------|
| OF-01 | Unused plugins | `packages/repository-plugin-nextjs/`, `packages/repository-plugin-security/` | Implemented with tests but never imported by any consumer |
| OF-02 | Empty mobile app | `apps/mobile/` | Capacitor shell with no package.json, no src/, not in workspaces |
| OF-03 | Root GOVERNANCE.md | `/GOVERNANCE.md` | Not registered in MASTER_DOCUMENT_REGISTRY, duplicates 3+ other docs |

### 2.4 Duplicate Implementations
| ID | Item | Location A | Location B | Notes |
|----|------|-----------|-----------|-------|
| DI-01 | HMACSignatureMiddleware | `core/src/middleware/HMACSignatureMiddleware.ts` | `backend/user/src/middleware/HMACSignatureMiddleware.ts` | Identical code, neither is consumed by routes |
| DI-02 | Coordinates Schema | `shared/src/schemas/coordinates.schema.ts` | Embedded in `shared/src/schemas/location.schema.ts` | Separate file not exported |
| DI-03 | Logger | `core/src/utils/logger.ts` | `shared/src/observability/logger.ts` | Two separate logger systems |
| DI-04 | Location primitives | `shared/src/utils/locationPrimitives.ts` | `core/src/utils/locationPrimitives.ts` | Likely drifted |
| DI-05 | Location utils | `shared/src/listingUtils/locationUtils.ts` | `shared/src/location/location.utils.ts` | Two approaches in same package |
| DI-06 | Geo types | `shared/src/utils/geoUtils.ts` | `shared/src/geo/geo.types.ts` | Overlapping geo utilities |
| DI-07 | Security patterns | `shared/src/security/hmacSignature.ts` | `shared/src/utils/securityPatterns.ts` | Different security utilities |
| DI-08 | Brain JSON vs config | `.agents/brain/static/*.json` | `packages/repository-brain/config/*.json` | 4 JSON pairs, exact duplicates |
| DI-09 | ADR numbering | `docs/adr/` (5 files) | `docs/architecture/adr/` (7+2 files) | ADR-001 through ADR-005 exist in both, different content |

### 2.5 Legacy Implementations
| ID | Item | Details |
|----|------|---------|
| LI-01 | Unused dependency: `slugify` | Listed in shared/package.json, never imported anywhere |
| LI-02 | Unused dependency: `sanitize-html` | Listed in core + backend-user deps, never used |
| LI-03 | sharp + jimp both installed | Duplicate image processing libraries in core |
| LI-04 | `@types/nanoid` | Deprecated type package, nanoid v3 has built-in types |
| LI-05 | `@types/ioredis` | Deprecated type package |

### 2.6 Deprecated Modules
| ID | Item | Details |
|----|------|---------|
| DM-01 | `docs/adr/` (all 5 files) | Superseded by `docs/architecture/adr/` and `docs/decisions/` — never marked deprecated |
| DM-02 | `docs/architecture/adr/ADR-001-ui-package-boundary.md` through ADR-004 | Not listed in ADR_INDEX.md — orphan ADRs |
| DM-03 | Root `GOVERNANCE.md` | Orphaned, duplicates content, not in master registry |

### 2.7 Empty Folders
| ID | Item | Details |
|----|------|---------|
| EF-01 | `apps/mobile/android/` | Capacitor scaffold, no app code |
| EF-02 | `apps/mobile/ios/` | Capacitor scaffold, no app code |
| EF-03 | `core/src/events/listeners/` | Directory appears empty |

### 2.8 Empty Packages
| ID | Item | Details |
|----|------|---------|
| EP-01 | `apps/mobile` | Not a workspace (no package.json), not in workspaces list |

### 2.9 Unused Exports
| ID | Item | Details |
|----|------|---------|
| UE-01 | `shared/src/enums/inventoryStatus.ts` | Not exported from shared/src/index.ts |
| UE-02 | `shared/src/enums/listingStatus.ts` | Not exported from shared/src/index.ts |
| UE-03 | `core/src/index.ts` barrel | Only exports logger; everything else commented out |

### 2.10 Unused Dependencies
| ID | Item | Workspace | Details |
|----|------|-----------|---------|
| UD-01 | `slugify` | `@esparex/shared` | Never imported |
| UD-02 | `sanitize-html` | `@esparex/core`, `@esparex/backend-user` | Never used in any source file |
| UD-03 | `repository-scanner` | `@esparex/repository-intelligence` | Listed but never imported |
| UD-04 | `repository-governance` | `@esparex/repository-intelligence` | Listed but never imported |

### 2.11 Duplicate Documentation
| ID | Item | Count | Details |
|----|------|-------|---------|
| DD-01 | ADR numbering | 16 files | ADR-001 through ADR-005 in 3 directories with different content |
| DD-02 | AI instructions | 5 files | AI_GOVERNANCE_BOUNDARY vs MAD_AI_OPERATING_INSTRUCTIONS vs PROMPT_TEMPLATE |
| DD-03 | Skills definitions | 3 sources | MAD_AI doc skills vs Brain manifest skills vs repository-skills code |
| DD-04 | Backlog/finding files | 12+ | TODO-AUDIT-FIXES, finding_classification, remediation-plan, verification-results, PHASE4_BACKLOG, BACKLOG.md, STABILIZATION_BACKLOG, etc. |
| DD-05 | Governance registries | 7+ | MASTER_DOCUMENT_REGISTRY, GOVERNANCE_REGISTRY, REGISTRY.md, VALIDATOR_REGISTRY, rules/README.md, ARCHITECTURE_VERSION.md, ADR_INDEX.md (x2), brain.manifest.json |
| DD-06 | Rules definitions | 86 markdown + 4 TS analyzers | Markdown rules in docs/governance/rules/ don't map to TS implementations |
| DD-07 | Public API docs | 2 files | PUBLIC_API.md (namespaces) vs CORE_PUBLIC_API.md (symbols) |
| DD-08 | Dependency policy | 3+ files | DEPENDENCY_POLICY.md, REPOSITORY_POLICY.md, PACKAGE_CONTRACT.md, .github/policies/dependency-policy.md |

### 2.12 Broken Cross-References
| ID | Referenced File | Referenced From (# files) | Status |
|----|----------------|--------------------------|--------|
| BX-01 | `REPOSITORY_GOVERNANCE.md` | 9 files | **DOES NOT EXIST** |
| BX-02 | `AGENTS.MD` / `AGENTS.md` | 7 files | **DOES NOT EXIST** |
| BX-03 | `DEPLOYMENT_MAP.md` | 2 files | **DOES NOT EXIST** |
| BX-04 | `API_CONTRACTS.md` | 4 files | **DOES NOT EXIST** |
| BX-05 | `ARCHITECTURE.md` (root) | `docs/decisions/README.md` | EXISTS but path may be wrong |

**Total: 42 stale references across 17 files pointing to 5 non-existent files.**

### 2.13 Circular Dependencies
| ID | Chain | Details |
|----|-------|---------|
| CD-01 | `services -> jobs -> models -> services` | Known circular dependency in `@esparex/core`, documented in legacy audit |

### 2.14 Secrets Leaked
| ID | File | Severity |
|----|------|----------|
| SL-01 | `core/.env` | **CRITICAL** — Live MongoDB URIs, JWT secrets, Redis passwords committed to git |
| SL-02 | `backend/user/.env` | **CRITICAL** — Live MongoDB URIs, JWT secrets, Redis passwords committed to git |

---

## PHASE 3 — Classification

### Classifications Legend
- **SAFE_DELETE** — Confirmed unused, no dependencies, safe to remove
- **ARCHIVE** — Historical value, not actively used, move to archive/
- **MERGE** — Overlapping content, combine into single canonical source
- **CONSOLIDATE** — Multiple related items that should be organized under one structure
- **KEEP** — Actively used, SSOT, or necessary
- **VERIFY_REQUIRED** — Appears unused but needs manual verification

### SECURITY (CRITICAL - act first)

| ID | Action | Reason | Owner | Confidence | Dependencies | Impact |
|----|--------|--------|-------|------------|--------------|--------|
| SL-01 | REMOVE FROM GIT | Live secrets committed in `core/.env` | platform-team | HIGH | None | CRITICAL -- rotate all exposed secrets |
| SL-02 | REMOVE FROM GIT | Live secrets committed in `backend/user/.env` | platform-team | HIGH | None | CRITICAL -- rotate all exposed secrets |

### SAFE_DELETE (48 items)

| ID | Item | Reason | Owner | Confidence | Dependencies | Impact |
|----|------|--------|-------|------------|--------------|--------|
| DC-01 | 11 unused backend utils | Never imported anywhere, replaced by core/utils | backend-team | HIGH | None | LOW |
| DC-02 | inventoryStatus.ts, listingStatus.ts | Not exported from shared, zero imports | platform-team | HIGH | None | LOW |
| DC-03 | 4 unused shared constants files | Exported but zero import references | platform-team | HIGH | None | LOW |
| DC-04 | coordinates.schema.ts | Not exported, zero imports | platform-team | HIGH | coordinates logic exists in location.schema.ts | LOW |
| DC-06 | adminPermissions.ts, locationEvents.ts | Never imported | backend-team | HIGH | None | LOW |
| UF-01 | ~45 unreferenced scripts | Not called from any package.json, CI, or code | platform-team | MEDIUM | None -- one-time migration scripts | MEDIUM |
| DI-01 | backend/user HMACSignatureMiddleware | Duplicate of core version, neither consumed | backend-team | HIGH | Core copy kept | LOW |
| DI-02 | coordinates.schema.ts | Duplicate content in location.schema.ts | platform-team | HIGH | None | LOW |
| UD-01 | slugify dependency | Listed but never imported | platform-team | HIGH | None | LOW |
| UD-02 | sanitize-html dependency | Listed but never used in code | platform-team | HIGH | None | LOW (verify no runtime require) |
| UD-03 | repository-scanner in intelligence | Listed but never imported | platform-team | HIGH | None | LOW |
| UD-04 | repository-governance in intelligence | Listed but never imported | platform-team | HIGH | None | LOW |
| LI-04 | @types/nanoid | Deprecated, nanoid v3 has built-in types | backend-team | HIGH | None | LOW |
| LI-05 | @types/ioredis | Deprecated type package | backend-team | HIGH | None | LOW |

### ARCHIVE (107+ items)

| ID | Item | Reason | Owner | Confidence | Dependencies | Impact |
|----|------|--------|-------|------------|--------------|--------|
| UF-02 | ~80 cleanup artifacts | Historical record, only latest run needed | platform-team | HIGH | None | LOW |
| UF-03 | ~40 archive report files | Already in archive, review for pruning | platform-team | HIGH | None | LOW |
| UF-04 | 27 legacy audit files | Already in archive/, historical only | platform-team | HIGH | None | LOW |
| EF-03 | Empty listeners dir | No content, move to docs if documenting | backend-team | HIGH | None | LOW |
| DM-01 | docs/adr/ (5 files) | Superseded by architecture/adr/ + decisions/ | platform-team | HIGH | Cross-references need updating | LOW |
| DM-02 | 4 orphan architecture ADRs | Not in ADR_INDEX, superseded by later ADRs | platform-team | MEDIUM | Verify not referenced elsewhere | LOW |
| DD-05 | Duplicate registries (6 of 7) | Keep MASTER_DOCUMENT_REGISTRY only | platform-team | MEDIUM | Cross-references need updating | MEDIUM |
| DD-06 | docs/governance/rules/ | 86 markdown rules not connected to TS analyzers | platform-team | MEDIUM | May have unique content worth preserving | MEDIUM |

### MERGE (10 items)

| ID | Item A | Item B | Target | Owner | Complexity |
|----|--------|--------|--------|-------|------------|
| DI-09 | docs/adr/ (all) | docs/architecture/adr/ | docs/architecture/adr/ | platform-team | MEDIUM |
| DD-02 | AI_GOVERNANCE_BOUNDARY.md | MAD_AI_OPERATING_INSTRUCTIONS.md | Single merged doc | platform-team | MEDIUM |
| DD-03 | 3 skill taxonomies | Single taxonomy in ERB-009 | ERB-009 (Brain Skill Manifest) | platform-team | MEDIUM |
| DD-04 | 4+ backlog files | TODO-AUDIT-FIXES.md | Single consolidated backlog | platform-team | LOW |
| DD-08 | 3+ dependency policies | PACKAGE_CONTRACT.md | Single SSOT | platform-team | MEDIUM |
| DI-03 | Core logger + shared logger | Single logger | platform-team | LOW |
| DI-04/05 | Duplicate location utils | Single location utils | platform-team | MEDIUM |

### CONSOLIDATE (4 sets)

| ID | Item | Target Structure | Owner | Complexity |
|----|------|-----------------|-------|------------|
| DD-05 | 7 registries | MASTER_DOCUMENT_REGISTRY only | platform-team | MEDIUM |
| DD-07 | 2 public API docs | Single PUBLIC_API.md | platform-team | LOW |
| DI-08 | Brain JSON + repository-brain config | Single source (pick one) | platform-team | LOW |
| BX-01-05 | 5 non-existent files | Create or remove references | platform-team | HIGH |

### KEEP (verified active)

| Item | Reason |
|------|--------|
| `packages/repository-plugin-sdk` | Active types contract, consumed by 3 packages |
| `packages/repository-plugin-nextjs` | Implemented but unused -- keep as future-ready |
| `packages/repository-plugin-security` | Implemented but unused -- keep as future-ready |
| `apps/mobile/` | Future target -- leave as scaffold |
| All SSOT docs | Tier 1 Canonical per master registry |
| All brain modules | Core AI initialization |
| All `packages/repository-*` main code | Active governance engine |

### VERIFY_REQUIRED (5 items)

| ID | Item | What to Verify | Owner |
|----|------|---------------|-------|
| VR-01 | 45 unreferenced scripts | Check if any are called via npx, node directly, or docs references | platform-team |
| VR-02 | swagger-jsdoc / swagger-ui-express | Check if actually consumed in routes or only configured | backend-team |
| VR-03 | slugify removal | Confirm no dynamic require() pattern | platform-team |
| VR-04 | sanitize-html removal | Confirm no runtime dynamic import | platform-team |
| VR-05 | core/src/index.ts barrel | Check if anything imports from plain `@esparex/core` (not deep path) | backend-team |

---

## PHASE 4 — Documentation Audit

### Total Documentation: ~400 .md files, ~30 .txt files, 0 .doc/.docx

### KEEP (SSOTs -- never delete)
| Document | Tier | Reason |
|----------|------|--------|
| `docs/MASTER_DOCUMENT_REGISTRY.md` | Tier 0 | SSOT of all documents |
| `docs/ssot/DOMAIN_MODEL_SSOT.md` | Tier 1 | Domain SSOT |
| `docs/ssot/API_CONTRACT_SSOT.md` | Tier 1 | API SSOT |
| `docs/ssot/ARCHITECTURE_FLOW_SSOT.md` | Tier 1 | Architecture SSOT |
| `docs/ssot/CI_CD_SSOT.md` | Tier 1 | CI/CD SSOT |
| `docs/architecture/REPOSITORY_SINGLE_SOURCE_OF_TRUTH.md` | Tier 1 | Architecture SSOT |
| `docs/architecture/PACKAGE_CONTRACT.md` | Tier 1 | Package contract |
| `docs/governance/GOVERNANCE_POLICY.md` | Tier 1 | Governance policy |
| `docs/governance/AI_GOVERNANCE_BOUNDARY.md` | Tier 1 (merge target) | AI boundary |
| `docs/architecture/adr/ADR-005` through ADR-007 | Tier 1 | Foundational ADRs |
| 12 Brain modules (ERB-000 through ERB-011) | AI Tier | AI initialization |
| `.cursorrules`, `.antigravity.system.prompt.md` | AI Tier | IDE compatibility |

### MERGE (combine into single doc)
| Document | Merge Into | Reason |
|----------|-----------|--------|
| `MAD_AI_OPERATING_INSTRUCTIONS.md` | Merge into AI_GOVERNANCE_BOUNDARY.md | Split AI governance |
| `docs/adr/ADR-001` through ADR-005 | Merge into docs/architecture/adr/ | ADR consolidation |
| `docs/governance/REPOSITORY_POLICY.md` | Merge into GOVERNANCE_POLICY.md | Dual policy masters |
| `docs/governance/GOVERNANCE_ARCHITECTURE.md` | Merge into GOVERNANCE_POLICY.md | Overlapping content |
| `docs/governance/EXECUTION_ENGINE.md` + EXECUTION_PIPELINE.md | Merge into single pipeline doc | Overlapping |
| `docs/architecture/CORE_PUBLIC_API.md` | Merge into PUBLIC_API.md | Same subject |
| `docs/governance/REGISTRY.md`, `VALIDATOR_REGISTRY.md`, `GOVERNANCE_REGISTRY.md` | Merge into MASTER_DOCUMENT_REGISTRY.md | 7 registries -> 1 |

### ARCHIVE (move to docs/archive/)
| Document | Reason |
|----------|--------|
| `docs/cleanup/` all timestamped runs | Historical, keep only latest |
| `docs/adr/` (all 5) | Superseded by architecture/adr/ |
| `docs/architecture/adr/ADR-001-ui-package-boundary` through ADR-004 | Not in ADR_INDEX, superseded |
| `docs/archive/reports/REFUND*` series | Already in archive |
| `archive/legacy/` all content | Already archived |
| `docs/finding_classification_todo.md` | Merge into TODO-AUDIT-FIXES first |
| `docs/remediation-plan.md` | Merge into TODO-AUDIT-FIXES first |
| `docs/verification-results.md` | Merge into TODO-AUDIT-FIXES first |

### SAFE_DELETE (documentation)
| Document | Reason |
|----------|--------|
| `editor.js` | Appears to be a one-off editor helper, not referenced |
| `fix_commits.js` | One-off commit fixing script |
| `governance-results.txt` | Runtime output, should not be committed |
| `docs/decisions/README.md` | References 5+ non-existent files, content superseded |

---

## PHASE 5 — Code Audit

### KEEP (active, SSOT, or consumed)
| Item | Reason |
|------|--------|
| All source files in apps/, backend/, core/, shared/ | Active application code |
| All `packages/repository-*` source files | Active governance engine |
| 84 referenced scripts in scripts/ | Called from package.json or CI |

### SAFE_DELETE (code -- 59 files)
| Item | Count | Classification |
|------|-------|----------------|
| `backend/user/src/utils/` unused files | 11 | dc-01 -- safe_delete |
| `shared/src/enums/inventoryStatus.ts` | 1 | dc-02 -- safe_delete |
| `shared/src/enums/listingStatus.ts` | 1 | dc-02 -- safe_delete |
| `shared/src/constants/businessConstants.ts` | 1 | dc-03 -- safe_delete |
| `shared/src/schemas/coordinates.schema.ts` | 1 | dc-04 -- safe_delete |
| `backend/user/src/middleware/HMACSignatureMiddleware.ts` | 1 | di-01 -- safe_delete (duplicate, core copy kept) |
| 45 unreferenced scripts in scripts/ | ~45 | uf-01 -- safe_delete (verify first) |

### ARCHIVE (code)
| Item | Classification |
|------|----------------|
| `apps/mobile/` entire directory | Keep as scaffold but exclude from CI |
| `logs/` directory contents | Runtime artifacts, add to .gitignore |

### VERIFY_REQUIRED (code)
| Item | What to Verify |
|------|----------------|
| 45 scripts | Check docs, README, or CI for hidden references |
| `core/src/index.ts` barrel | Check if `import { ... } from '@esparex/core'` (not deep path) is used anywhere |
| `slugify` removal | grep for `require('slugify')` or `import.*slugify` patterns |

---

## PHASE 6 — AI Governance Audit

### Current State: Fragmented across 6 locations with 3+ competing authority claims

### KEEP (AI governance)
| Item | Reason |
|------|--------|
| `.agents/brain/` all 12 modules | Core AI initialization system |
| `.agents/decisions/` 3 ADRs | Agent decision history |
| `ai-governance/AI_CONTEXT.json` | Machine-readable context (authorized by boundary) |
| `ai-governance/PROMPT_TEMPLATE.md` | Prompt template (authorized by boundary) |
| `.cursorrules` | Thin pointer (correct pattern) |
| `.antigravity.system.prompt.md` | Thin pointer (correct pattern) |
| `packages/repository-skills/src/` | Code-level skill implementations |
| `packages/repository-intelligence/src/` | Intelligence/recommendation engines |

### MERGE (AI governance)
| Item | Merge Into | Reason |
|------|-----------|--------|
| `MAD_AI_OPERATING_INSTRUCTIONS.md` (354 lines) | AI_GOVERNANCE_BOUNDARY.md | Split AI governance violates One-Brain Rule |
| 3 skill taxonomies | Single taxonomy in ERB-009 | Incompatible skill definitions |
| Brain JSON (`.agents/brain/static/`) | repository-brain/config/ or vice versa | Exact duplicate, pick one owner |

### ARCHIVE (AI governance)
| Item | Reason |
|------|--------|
| `docs/adr/` all 5 | Superseded by more detailed ADRs |

### Missing (CREATE)
| Missing Item | Reason |
|-------------|--------|
| `AGENTS.md` | Referenced by 7+ files, most agents expect this as entry point |
| Conflict resolution procedure | No guidance when docs disagree (they do, frequently) |

### AI Hierarchy (single, consolidated)
```
1. AGENTS.md (NEW - first file agent loads)
   -> MASTER_DOCUMENT_REGISTRY.md
2. AI_GOVERNANCE_BOUNDARY.md (merged with operating instructions)
3. 12 Brain modules (ERB-000 through ERB-011)
4. repository-skills (code implementations)
5. repository-runtime CLI
```

---

## PHASE 7 — Cleanup Plan

### Cleanup Order (by risk, lowest first)

| Order | Phase | Items | Risk | Estimated Effort |
|-------|-------|-------|------|------------------|
| 0 | SECURITY | Remove core/.env + backend/user/.env from git, rotate secrets | CRITICAL | 1 hour |
| 1 | ARCHIVE docs | Move 80 cleanup artifacts + 40 archive reports to single location | LOW | 1 day |
| 2 | SAFE_DELETE unused scripts | Remove 45 unreferenced scripts (verify first) | LOW | 2 days |
| 3 | SAFE_DELETE dead code | Remove 11 backend utils, 2 orphan enums, 4 unused constants, duplicate middleware | LOW | 1 day |
| 4 | SAFE_DELETE unused deps | Remove slugify, sanitize-html, 2 unused repo-* deps, 2 deprecated type packages | LOW | 0.5 day |
| 5 | MERGE docs | Merge ADRs, AI governance, policy docs, backlog files | MEDIUM | 3 days |
| 6 | CONSOLIDATE registries | Reduce 7 registries to 1, fix 42 broken cross-references | MEDIUM | 3 days |
| 7 | RESOLVE conflicts | Branch strategy, dependency naming, governance lifecycle | MEDIUM | 2 days |
| 8 | CREATE missing docs | AGENTS.md, onboarding doc, conflict resolution procedure | MEDIUM | 2 days |

### Delete Candidates (SAFE_DELETE -- 59 files total)
```
# Backend utils (11 files)
backend/user/src/utils/adminBaseController.ts
backend/user/src/utils/adminLogHelpers.ts
backend/user/src/utils/adminLogger.ts
backend/user/src/utils/contentHandler.ts
backend/user/src/utils/controllerUtils.ts
backend/user/src/utils/deviceFingerprint.ts
backend/user/src/utils/errorResponse.ts
backend/user/src/utils/health.ts
backend/user/src/utils/requestParams.ts
backend/user/src/utils/respond.ts
backend/user/src/utils/smartAlertHelpers.ts

# Shared orphan enums (2 files)
shared/src/enums/inventoryStatus.ts
shared/src/enums/listingStatus.ts

# Shared unused constants (4 files)
shared/src/constants/businessConstants.ts
shared/src/constants/location.ts          # Keep if radius values are used
shared/src/constants/serviceTypes.ts
shared/src/constants/mobileVisibility.ts

# Shared orphaned schema (1 file)
shared/src/schemas/coordinates.schema.ts

# Duplicate middleware (1 file -- keep core copy)
backend/user/src/middleware/HMACSignatureMiddleware.ts

# Unreferenced scripts (~45 files -- verify first)
scripts/audit-mongodb-inventory.js
scripts/catalog-null-canonical-remediation.js
scripts/catalog-parity-convergence.js
scripts/catalog-shadow-diff-audit.js
scripts/catalog-status-remediation.js
scripts/catalog-strict-collision-remediation.js
scripts/check-collisions.js
scripts/check-infra-exports.js
scripts/clean-workspace.js
scripts/e2e-mock-api.mjs
scripts/enforce-local-quality-gates.js
scripts/enforce-moderation-status-ssot.mjs
scripts/evidence-gate-events.js
scripts/evidence-gate-services.js
scripts/evidence-gate-utils.js
scripts/fix-default-imports.js
scripts/fix-dist-alias.js
scripts/fix-jest-redis-mock.js
scripts/fix-mocks.js
scripts/fix-newlines-correctly.js
scripts/fix-newlines.js
scripts/fix-test-mocks.js
scripts/fix-utils-alias.js
scripts/fix-whitespace.js
scripts/generate-barrels.js
scripts/generate-transport-separation-audit.js
scripts/hotspot-healer.js
scripts/madge-orphan-check.mjs
scripts/migrate-roles.ts
scripts/migrate-user-type.ts
scripts/move-infrastructure.js
scripts/orphan-sweep.cjs
scripts/populate-all-services.js
scripts/populate-exact-services.js
scripts/populate-services-barrel.js
scripts/rewrite-edge-services.js
scripts/rewrite-event-imports.js
scripts/rewrite-infrastructure-imports.js
scripts/rewrite-mock-services.js
scripts/rewrite-model-imports.js
scripts/rewrite-service-imports.js
scripts/rewrite-utils-imports.js
scripts/setup-mock.js
scripts/smart-fix-utils.js
scripts/test-proxy.js
scripts/undo-utils-alias.js
scripts/verify-public-api.js
scripts/verify-services-barrel.js
```

### Archive Candidates (~150 files)
```
# Cleanup artifacts
docs/cleanup/2026-07-03T02:41:*/     (all)
docs/cleanup/2026-07-03T02:51:*/     (all)
docs/cleanup/2026-07-03T03:00:*/     (all)
docs/cleanup/2026-07-03T03:09:*/     (all)
docs/cleanup/2026-07-03T03:21:*/     (all)
docs/cleanup/2026-07-03T03:32:*/     (all)
docs/cleanup/2026-07-03T03:48:*/     (all)
# Keep latest run only

# Superseded ADRs
docs/adr/ADR-001-SSOT.md
docs/adr/ADR-002-Branch-Strategy.md
docs/adr/ADR-003-Deployment.md
docs/adr/ADR-004-API-Versioning.md
docs/adr/ADR-005-Governance.md

# Legacy audits
archive/legacy/2026-05/ (all)

# Report archives (already in archive, could be pruned)
docs/archive/reports/REFUND-003-*.md
docs/archive/reports/REFUND-004*.md
docs/archive/reports/REFUND-004A*.md
docs/archive/reports/REFUND-004B*.md
docs/archive/reports/REFUND-004C*.md
docs/archive/reports/REFUND-005*.md
```

### Merge Candidates (10 operations)
```
# ADR consolidation
docs/adr/* -> docs/architecture/adr/ (with updated ADR numbers and cross-refs)

# AI governance
MAD_AI_OPERATING_INSTRUCTIONS.md -> AI_GOVERNANCE_BOUNDARY.md

# Policy consolidation
REPOSITORY_POLICY.md -> GOVERNANCE_POLICY.md
GOVERNANCE_ARCHITECTURE.md -> GOVERNANCE_POLICY.md
EXECUTION_ENGINE.md + EXECUTION_PIPELINE.md -> single doc

# Backlog consolidation
finding_classification_todo.md -> TODO-AUDIT-FIXES.md
remediation-plan.md -> TODO-AUDIT-FIXES.md
verification-results.md -> TODO-AUDIT-FIXES.md

# AI skill taxonomy
MAD_AI skill definitions -> ERB-009 (Brain Skill Manifest)

# Registry consolidation
6 registries -> MASTER_DOCUMENT_REGISTRY.md

# Public API docs
CORE_PUBLIC_API.md -> PUBLIC_API.md
```

### Risk Analysis
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| 45 scripts might be referenced by docs or CI | MEDIUM | MEDIUM | Full grep before deletion |
| Removing slugify might break dynamic require | LOW | LOW | Check for require() patterns |
| Archiving ADRs breaks cross-references | HIGH | LOW | Update all 42 stale references |
| Merging AI governance loses operating details | LOW | HIGH | Preserve all content in merge target |
| Removing .env files from git requires secret rotation | MEDIUM | CRITICAL | Coordinate with team, have new secrets ready |
| Removing unused deps may break transitive deps | LOW | LOW | npm install will resolve |

### Rollback Plan
Every deletion must be:
1. Committed separately (atomic commits)
2. Reversible via `git revert <commit>`
3. Tested individually before the next deletion

```
Phase 0: git rm --cached core/.env backend/user/.env   # Stop tracking, DON'T delete from disk
Phase 1: Archive docs in single commit
Phase 2: Delete dead code in individual commits (one per category)
Phase 3: Merge docs in individual commits
Phase 4: Consolidate registries and fix cross-references
Phase 5: Create missing docs (AGENTS.md, etc.)
Phase 6: npm install to verify dependency removals

Rollback any phase: git revert <phase-commit>
```

---

## PHASE 8 — Approval Gate

**Stop. Do not modify files.**

This cleanup plan identifies **59 safe-to-delete files, ~150 archive candidates, 10 merge operations, 4 consolidations, and 2 critical security fixes.**

### Required Approvals Before Any Deletion:
1. **platform-team** -- Script deletions, governance docs, AI system
2. **backend-team** -- Backend utils, middleware, core changes
3. **security-team** -- .env removal + secret rotation
4. **all teams** -- ADR consolidation and cross-reference fixes

### Escalation Items (do not proceed without discussion):
- Which skill taxonomy to keep (MAD_AI vs Brain Manifest vs repository-skills)
- Where AGENTS.md should live (root .md pattern)
- Whether `apps/mobile` should be removed or kept as scaffold
- How to handle the `core/src/index.ts` barrel export

### Signature:
```
Date: 2026-07-08
Auditor: AI Runtime Auditor
Status: AWAITING APPROVAL
```

---

## APPENDIX: Quick Reference

### By Severity
| Severity | Count | Key Items |
|----------|-------|-----------|
| CRITICAL | 2 | Secrets leaked in .env files |
| HIGH | 3 | 42 stale cross-references, 45 unreferenced scripts, triple ADR conflict |
| MEDIUM | 8 | Unused plugins, duplicate implementations, 87+ disconnected rules, 5 non-existent referenced files |
| LOW | 40+ | Dead code, unused deps, archive bloat, empty scaffold |

### By Directory (delete candidates)
| Directory | Safe Delete | Archive | Merge |
|-----------|-------------|---------|-------|
| `scripts/` | ~45 | 0 | 0 |
| `backend/user/src/utils/` | 11 | 0 | 0 |
| `shared/src/enums/` | 2 | 0 | 0 |
| `shared/src/constants/` | 4 | 0 | 0 |
| `shared/src/schemas/` | 1 | 0 | 0 |
| `backend/user/src/middleware/` | 1 | 0 | 0 |
| `docs/cleanup/` | 0 | ~80 | 0 |
| `docs/adr/` | 0 | 5 | 5 |
| `docs/governance/` | 0 | ~90 | 4 |
| `docs/` root | 0 | 3 | 0 |

### Quick Wins (can do immediately, no coordination)
1. `shared/src/enums/inventoryStatus.ts` -- delete (not exported, unused)
2. `shared/src/schemas/coordinates.schema.ts` -- delete (not exported, content in location.schema.ts)
3. `docs/cleanup/` archive extra runs -- keep only latest
4. `editor.js`, `fix_commits.js`, `governance-results.txt` -- delete (one-off artifacts)
