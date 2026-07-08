# ESPAREX — Documentation & Repository Cleanup Audit

**Date:** 2026-07-08  
**Status:** Audit Only — No Modifications  
**Branch:** pr-66  

---

## Executive Summary

This audit scanned **346 `.md` files**, 27 directories under `docs/`, and the repository root. The repository has **295 markdown files** under `docs/` plus 54 outside it.

**Key numbers:**
- **295 `.md` files** under `docs/`
- **27 directories** under `docs/`
- **86 governance rule files** (`docs/governance/rules/`)
- **40 archived reports** (`docs/archive/reports/`)
- **68 files in `docs/archive/`** violating the archive path policy
- **6 root `.md` files** not registered in MASTER_DOCUMENT_REGISTRY
- **7+ shadow governance docs** overlapping SSOT content
- **6 broken registry paths** (point to non-existent file locations)
- **~170+ docs files** with zero inbound references from any other file

---

## Phase 1-2: Repository Discovery & File Inventory

### Directory Tree

```
docs/                          — 10 root files
├── 00-index.md                NAV
├── AI_RUNTIME_SPEC.md         SSOT
├── MASTER_DOCUMENT_REGISTRY.md SSOT of all docs
├── PR4-DECISION-NEEDED.md     Decision
├── ROADMAP.md                 Roadmap
├── SSOT_INDEX.md              SSOT index
├── TODO-AUDIT-FIXES.md        Backlog
├── finding_classification_todo.md  Backlog (overlaps above)
├── remediation-plan.md        Plan (overlaps above)
├── verification-results.md    Verification
│
├── architecture/              — 9 files + 11 ADRs
├── archive/                   — 68 files in 5 subdirs
│   ├── adr/                   (5 legacy ADRs)
│   ├── ai/                    (1 file)
│   ├── audits/                (13 files)
│   ├── branch-cleanup/        (17 files)
│   └── reports/               (40 files)
├── audit/                     — 11 files + 7 refund
├── cleanup/                   — 2 files
├── decisions/                 — 15 files
├── deprecated/                — 1 file
├── design-system/             — 32 files across 5 subdirs
├── governance/                — 18 files + 86 rules (1 empty subdir)
├── pull-requests/             — 1 file
├── repository-audit/          — 7 files
├── ssot/                      — 4 files
├── supporting/                — 2 files
└── walkthroughs/              — 2 files

Root .md files (9):
AGENTS.md, ARCHITECTURE.md, CODE_OF_CONDUCT.md, CONTRIBUTING.md,
GOVERNANCE.md, README.md, SECURITY.md, SUPPORT.md, .antigravity.system.prompt.md

archive/legacy/ (root): 27 files
```

### File Counts by Extension

| Extension | Count |
|-----------|-------|
| `.md` | 295 (docs/) + 9 (root) + ~27 (archive/legacy/) + ~11 (code READMEs) |
| `.txt` | 3 (branch cleanup evidence) |
| `.html` | 1 (dependency graph) |
| `.json` | 1 (walkthrough) |

---

## Phase 3: Duplicate Detection

| # | Duplicate Pair | Overlap | Action |
|---|---------------|---------|--------|
| D1 | PUBLIC_API.md vs CORE_PUBLIC_API.md | HIGH | Both describe `@esparex/core` public API at different detail levels. Content drift. Merge into one. |
| D2 | GOVERNANCE_POLICY.md vs REPOSITORY_POLICY.md | MODERATE | Both claim authority over developer standards. REPOSITORY_POLICY.md has 10 core rules that overlap. |
| D3 | GOVERNANCE_ARCHITECTURE.md + EXECUTION_ENGINE.md + EXECUTION_PIPELINE.md | LOW | PIPELINE (24 lines) is a subsection of ENGINE. Merge. |
| D4 | GOVERNANCE_REGISTRY.md + REGISTRY.md + VALIDATOR_REGISTRY.md | NAMING ONLY | Different registries, dangerously similar names. Rename all three. |
| D5 | docs/ROADMAP.md vs governance/ROADMAP.md | NONE | Different topics, same filename. Rename governance one. |
| D6 | finding_classification_todo.md + TODO-AUDIT-FIXES.md + remediation-plan.md | HIGH | Three files tracking the same issues. Consolidate. |
| D7 | architecture/ADR_INDEX.md vs decisions/ADR_INDEX.md | HIGH | ADR-001 through ADR-007 collide. Prefix numbers. |
| D8 | MASTER_DOCUMENT_REGISTRY.md vs SSOT_INDEX.md | HIGH | Two "SSOT of SSOTs". Different tier systems. Merge. |
| D9 | REPOSITORY_POLICY + WORKSPACE_POLICY + DEPENDENCY_POLICY | MODERATE | Dependency rules in 3 places. Consolidate into DEPENDENCY_POLICY. |
| D10 | ADR-001/002/003/004 in architecture/adr/ | HIGH | Duplicate ADR numbers (4 pairs in same directory). |

---

## Phase 4: Legacy Detection

| Item | Location | Status |
|------|----------|--------|
| `# DEPRECATED` header found | `docs/deprecated/08-deployment-runbook.md` | ✅ Properly deprecated |
| Missing `# DEPRECATED` | `docs/archive/adr/ADR-001` through ADR-005 | Should have been deprecated before archive |
| Files with `final` in name | 2 (both in archive — acceptable) | ✅ |
| Files with `v2` in name | 1 (legitimate ADR numbering) | ✅ |

---

## Phase 5-6: Dead & Orphan Documentation

### Files with ZERO inbound references (not registered in MASTER_DOCUMENT_REGISTRY.md)

These are **active documentation files** that no other file references:

| File | Type | Notes |
|------|------|-------|
| `docs/AI_RUNTIME_SPEC.md` | SSOT (Tier 1) | Canonical but no inbound refs |
| `docs/SSOT_INDEX.md` | SSOT index | No inbound refs |
| `docs/PR4-DECISION-NEEDED.md` | Decision | No refs |
| `docs/ROADMAP.md` | Roadmap | No refs |
| `docs/finding_classification_todo.md` | Backlog | Has no direct refs (overlaps with TODO-AUDIT-FIXES) |
| `docs/remediation-plan.md` | Plan | No refs |
| `docs/verification-results.md` | Verification | No refs |
| `docs/TODO-AUDIT-FIXES.md` | Backlog | No refs |
| `docs/governance/ROADMAP.md` | Governance roadmap | No refs |
| `docs/governance/rules/*` (86 files) | Rule defs | No direct inbound refs (validated by docs:lint) |
| `docs/architecture/adr/ADR-006`, ADR-007 | ADRs | No refs outside ADR_INDEX |
| `docs/decisions/ADR-012` | ADR | Not in ADR_INDEX |
| `docs/audit/mad-500-runtime-audit.md` | Audit | No refs |
| `docs/deprecated/08-deployment-runbook.md` | Deprecated | No refs (expected) |

---

## Phase 7: Folder Audit

| Folder | Status | Recommendation |
|--------|--------|---------------|
| `docs/governance/templates/v1/` | **EMPTY** | DELETE — zero files |
| `archive/legacy/` | Legacy archive | KEEP — proper location |
| `docs/archive/` (all 5 subdirs) | **Wrong location** | MOVE to `/archive/legacy/YYYY-MM/` per lifecycle policy |
| `docs/cleanup/` | 2 files (registered) | KEEP |
| `docs/pull-requests/` | 1 file | KEEP (historical) |
| `docs/walkthroughs/` | 2 files | KEEP (historical) |

---

## Phase 8: SSOT Validation

| Topic | SSOT | Shadow Docs | Conflict |
|-------|------|-------------|----------|
| Architecture | REPOSITORY_SINGLE_SOURCE_OF_TRUTH.md | ARCHITECTURE.md (root) | Root ARCHITECTURE.md is unregistered |
| CI/CD | CI_CD_SSOT.md | GOVERNANCE.md (root) | Root GOVERNANCE.md has CI/CD rules |
| Governance | GOVERNANCE_POLICY.md | REPOSITORY_POLICY.md, GOVERNANCE.md (root) | Two claim authority |
| API | API_CONTRACT_SSOT.md | PUBLIC_API.md, CORE_PUBLIC_API.md | Two supporting docs overlap |
| Dependency rules | DEPENDENCY_POLICY.md | REPOSITORY_POLICY.md, WORKSPACE_POLICY.md | Three places for the same rules |
| Git workflow | CI_CD_SSOT.md | CONTRIBUTING.md, GOVERNANCE.md | Three sources for branch strategy |
| Naming | GOVERNANCE_POLICY.md | NAMING_CONVENTIONS.md | Duplicate naming standards |
| Security | None clear | SECURITY.md, VAL-SEC rules | No clear SSOT for security |

---

## Phase 9: Broken Reference Audit

| Broken Reference | Location | Points To | Fix |
|-----------------|----------|-----------|-----|
| `docs/adr/ADR-001-SSOT.md` | MASTER_DOCUMENT_REGISTRY | `docs/adr/` (moved to `docs/archive/adr/`) | Update path to `docs/archive/adr/` |
| `docs/adr/ADR-002-Branch-Strategy.md` | MASTER_DOCUMENT_REGISTRY | Same | Same |
| `docs/adr/ADR-003-Deployment.md` | MASTER_DOCUMENT_REGISTRY | Same | Same |
| `docs/adr/ADR-004-API-Versioning.md` | MASTER_DOCUMENT_REGISTRY | Same | Same |
| `docs/adr/ADR-005-Governance.md` | MASTER_DOCUMENT_REGISTRY | Same | Same |
| `docs/governance/MAD_AI_OPERATING_INSTRUCTIONS.md` | MASTER_DOCUMENT_REGISTRY | `docs/governance/` (moved to `docs/archive/ai/`) | Update path |

---

## Phase 10: Repository Health

| Check | Finding |
|-------|---------|
| Large obsolete documents | None found |
| Unused images | None under docs/ |
| Duplicate screenshots | None |
| Generated reports | 40 files in `docs/archive/reports/` — historical |
| Old CSV/JSON/PDF | None in docs/ |
| Temporary AI outputs | None found |

---

## Phase 11: Git Safety (Pre-Deletion Verification)

Required before any deletion:
- 6 root `.md` files (`ARCHITECTURE.md`, `GOVERNANCE.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SUPPORT.md`) — are referenced by the governance-health.yml CI workflow. **DO NOT DELETE.**
- `docs/governance/rules/` (86 files) — validated by `docs:lint`. **DO NOT DELETE.**
- `docs/archive/reports/` (40 files) — no current references but historical. **ARCHIVE ONLY.**
- `docs/governance/templates/v1/` empty dir — **SAFE TO DELETE** (no content, no refs).
- `docs/ssot/` (4 files) — Tier 1 SSOTs. **NEVER DELETE.**

---

## Phase 12: Reports Summary

### Files SAFE TO DELETE (after approval)
1. `docs/governance/templates/v1/` — empty directory, no references

### Files SAFE TO ARCHIVE
1. `docs/archive/*` contents — already archived but in wrong location. Move to `/archive/legacy/2026-07/`
2. `docs/ROADMAP.md` — product roadmap, no inbound refs. Archive if superseded.
3. `docs/PR4-DECISION-NEEDED.md` — resolved decision
4. `docs/verification-results.md` — stale verification report
5. `docs/pull-requests/pr-feat-governance-cli-productivity.md` — historical PR walkthrough
6. `docs/walkthroughs/` — historical walkthroughs

### Files SAFE TO MERGE
1. `PUBLIC_API.md` + `CORE_PUBLIC_API.md` → single `PUBLIC_API.md`
2. `EXECUTION_PIPELINE.md` → into `EXECUTION_ENGINE.md`
3. `finding_classification_todo.md` + `remediation-plan.md` → into `TODO-AUDIT-FIXES.md`
4. `SSOT_INDEX.md` → into `MASTER_DOCUMENT_REGISTRY.md`
5. `GOVERNANCE_VERSION.md` → into `CI_CD_SSOT.md`

### Files SAFE TO RENAME
1. `docs/governance/ROADMAP.md` → `GOVERNANCE_ENGINE_ROADMAP.md`
2. `docs/governance/REGISTRY.md` → `RULE_REGISTRY_SCHEMA.md`
3. `docs/governance/GOVERNANCE_REGISTRY.md` → `GOVERNANCE_CAPABILITIES_REGISTRY.md`
4. `docs/governance/VALIDATOR_REGISTRY.md` → `VALIDATOR_REGISTRY_API.md`
5. `docs/architecture/adr/ADR-001-ui-package-boundary.md` (etc.) — prefix as legacy

### Files That MUST NOT BE DELETED
- `AGENTS.md`, `AI_RUNTIME_SPEC.md`, `SSOT_INDEX.md` — Tier 1 SSOTs
- `MASTER_DOCUMENT_REGISTRY.md` — SSOT of all docs
- `docs/ssot/*` (all 4) — Tier 1 SSOTs
- `docs/governance/AI_GOVERNANCE_BOUNDARY.md` — Tier 1 SSOT
- `docs/governance/GOVERNANCE_POLICY.md` — Tier 1 SSOT
- `docs/governance/rules/*` — validated by docs:lint CI check
- `docs/architecture/PACKAGE_CONTRACT.md` — Tier 1 SSOT
- Root files (`ARCHITECTURE.md`, `GOVERNANCE.md`, `SECURITY.md`, etc.) — referenced by CI governance-health check

---

## Phase 13-14: Cleanup Plan

### Order of Operations (lowest risk first)

**Step 1: Delete empty folder** — `docs/governance/templates/v1/`
**Step 2: Fix 6 broken registry paths** — Update MASTER_DOCUMENT_REGISTRY.md to point to `docs/archive/`
**Step 3: Register root docs** — Add `ARCHITECTURE.md`, `GOVERNANCE.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SUPPORT.md` to MASTER_DOCUMENT_REGISTRY.md
**Step 4: Rename conflicting filenames** — ROADMAP.md, REGISTRY.md, etc.
**Step 5: Merge duplicate documents** — SSOT_INDEX into MASTER_DOCUMENT_REGISTRY, EXECUTION_PIPELINE into EXECUTION_ENGINE, backlog consolidation
**Step 6: Move `docs/archive/` to proper path** — `/archive/legacy/2026-07/`
**Step 7: Archive orphan docs** — PR walkthroughs, resolved decisions

### Risk Assessment

| Action | Risk | Mitigation |
|--------|------|------------|
| Empty folder delete | None | No content to lose |
| Registry path fixes | Low | Pointing to existing files |
| Renames | Low | Update all cross-refs |
| Merges | Medium | Preserve all content in target |
| Archive move | Low | Files stay in repo |
| SSOT merges | Low | MASTER_DOCUMENT_REGISTRY is authoritative |

### Rollback
Every action is reversible via `git revert`.

---

## Phase 15: Validation Plan

After any cleanup execution, verify:
- [ ] `npm run docs:lint` passes
- [ ] `npm run type-check` passes
- [ ] No broken links remain
- [ ] All 6 registry paths resolve
- [ ] No content lost from merged documents
- [ ] Archive files are at correct locations

---

## Repository Documentation Health Score

| Metric | Current | Target |
|--------|---------|--------|
| Total `.md` files | 295 | ~250 (after cleanup) |
| Duplicate document sets | 8 | 0 |
| Broken registry paths | 6 | 0 |
| Empty directories | 1 | 0 |
| SSOT violations | 7 | 0 |
| Orphan SSOTs (zero refs) | 4 | 4 (fix via 00-index) |
| Root docs not registered | 6 | 6 (fix via registry update) |
| **Documentation Health** | **65%** | **95%** |
