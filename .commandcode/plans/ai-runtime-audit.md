# Enterprise AI Runtime Audit — Esparex Monorepo

**Date:** 2026-07-08  
**Owner:** mad-enter-tainer  
**Maturity:** Level 3 (Structured & Governed) — 71.3%  
**AI Runtime Readiness:** 5/10

---

## Executive Summary

The Esparex monorepo has a sophisticated multi-layered governance system with an in-house repository governance engine, documentation linting, CI/CD automation, and AI boundary enforcement. However, the maturity is undermined by **significant documentation bloat, structural conflicts, and missing operational fundamentals**.

- **~160 AI-relevant files** across 6 locations, 87+ governance rule definitions
- **~400 Markdown files** in `docs/`, including triple ADR numbering conflicts
- **5 incompatible branch strategies** found across 6+ documents
- **ssot-tier-1** claims 6-7 max docs but lists **15 documents** (self-contradictory)
- **No AGENTS.md, no developer onboarding, no runbook/on-call documentation**
- **Testing is critical** (5/10) — only 21% of workspaces have test coverage

---

## Repository Understanding

### Workspace Architecture

```
apps/web ──┐                    (Next.js 16, React 18)
apps/admin ─┤                   (Next.js 16, React 18)
apps/mobile ┘                   (Capacitor native wrapper)
            │
backend/user ─────────────────  (Express 5, thin routing shell)
            │
core ─────────────────────────  (Mongoose, BullMQ, Redis, business logic)
            │
shared ───────────────────────  (Zod schemas, DTOs, constants, types)
```

### Repository-* Governance Package Stack

| Package | Role | Status |
|---------|------|--------|
| `repository-scanner` | Filesystem discovery — only fs-touching package | Active |
| `repository-brain` | Knowledge compilation -> BrainSnapshot (frozen/validated) | Active |
| `repository-governance` | Rules engine: 4 analyzers + 4 validators + scoring | Active |
| `repository-skills` | Plugin-based skill execution (4 reference skills) | Active |
| `repository-intelligence` | Health scores, recommendations, tech debt | Active |
| `repository-plugin-sdk` | Zero implementation — interfaces only | Stub |
| `repository-plugin-security` | Security advisory checking | Active |
| `repository-plugin-nextjs` | Next.js routing audit | Active |
| `repository-runtime` | Top-level SDK orchestrator + CLI (11 commands) | Active |

### AI Brain System (`.agents/brain/`)

12 modules (ERB-000 through ERB-011):
- Machine-readable JSON mirrors in `static/` duplicate `packages/repository-brain/config/` exactly
- 2 IDE compatibility pointers (`.cursorrules`, `.antigravity.system.prompt.md`) correctly defer to canonical docs

---

## Scoring

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Architecture | 9/10 | Clean 4-layer separation, enforcement tooling, ADR-driven |
| SSOT | 6/10 | Good concept but self-contradictory cap, dual policy masters |
| Rules | 5/10 | 87+ rules but fragmented across 6 locations with conflicts |
| Instructions | 4/10 | Split AI governance, no AGENTS.md, competing instruction sets |
| SOPs | 3/10 | Critical gaps: onboarding, runbook, AGENTS.md |
| AI Skills | 7/10 | Well-structured skill system, sparse taste files |
| Git Governance | 7/10 | 12 workflows but 5 conflicting branch strategy docs |
| CI/CD | 8/10 | Comprehensive gating, serial only, no npm audit |
| Security | 7/10 | Strong implementation, unused sanitize-html, CSP disabled |
| Documentation | 3/10 | Triple ADRs, 80 cleanup artifacts, 4 overlapping backlogs |
| Developer Experience | 4/10 | No onboarding, ~400 docs, serial CI, heavy pre-commit |
| AI Runtime Design | 5/10 | Infrastructure exists, fragmentation prevents reliable execution |

**Overall: 53/120 = 44%**

---

## SSOT Hierarchy

### The documented 5-layer model is correct:
```
Layer 1: Domain Model (Business Rules)
Layer 2: API & Architecture (Interface Rules)
Layer 3: Engineering Policy (Process & Coding Rules)
Layer 4: Infrastructure & Pipelines (CI/CD Rules)
Layer 5: AI Boundary (Agent Execution Rules)
```

### Conflicts found:
1. **Tier cap violation**: Claims max 6-7 Tier 1 docs -> actually has 15
2. **Dual policy masters**: `GOVERNANCE_POLICY.md` vs `REPOSITORY_POLICY.md` both claiming Layer 3 authority
3. **AI boundary split**: `AI_GOVERNANCE_BOUNDARY.md` (43 lines) vs `MAD_AI_OPERATING_INSTRUCTIONS.md` (354 lines)

---

## Conflicts (7 total)

| ID | Conflict | Severity |
|----|----------|----------|
| C-01 | Branch strategy: 5 incompatible models across 6+ docs | Critical |
| C-02 | Dependency rules: `@mad/*` vs `@esparex/*` naming | Critical |
| C-03 | Dual policy masters: GOVERNANCE_POLICY vs REPOSITORY_POLICY | Critical |
| C-04 | AI governance split: boundary (43 lines) vs operating manual (354) | High |
| C-05 | Tier 1 cap violation: claims 6-7 max, lists 15 | High |
| C-06 | ADR numbering triple collision: ADR-001-005 in 3 locations | High |
| C-07 | Governance lifecycle: 5-state described differently in 2 docs | Medium |

---

## Duplicates (6 sets)

| ID | Duplicate Set | Waste |
|----|--------------|-------|
| D-01 | ADR-001 through ADR-005 across `docs/adr/`, `docs/architecture/adr/`, `docs/decisions/` | 15 files |
| D-02 | Cleanup artifacts: ~80 files, 7 runs with identical filenames | ~80 files |
| D-03 | Overlapping backlogs: `TODO-AUDIT-FIXES.md`, `finding_classification_todo.md`, `verification-results.md`, `remediation-plan.md` | 4 files |
| D-04 | Brain JSON vs repository-brain config | 4 JSON pairs |
| D-05 | Governance registries: REGISTRY.md, GOVERNANCE_REGISTRY.md, VALIDATOR_REGISTRY.md | 3 files |

---

## Missing Standards

| Standard | Impact |
|----------|--------|
| AGENTS.md | Referenced by multiple docs, doesn't exist |
| Developer onboarding document | No entry point for new developers |
| Runbook / on-call procedures | No incident response documentation |
| Branch strategy SSOT | 5 conflicting models, no single winner |
| Published API docs | Swagger source exists but no generated output |
| Coverage thresholds | No minimums for any workspace |

---

## AI Execution Flow (Current)

```
1. CONTEXT DISCOVERY
   .cursorrules / .antigravity.system.prompt.md -> MASTER_DOCUMENT_REGISTRY.md

2. GOVERNANCE DISCOVERY
   MASTER_DOCUMENT_REGISTRY.md -> AI_GOVERNANCE_BOUNDARY.md -> PROMPT_TEMPLATE.md

3. CANONICAL SSOT LOADING
   4 SSOT docs + GOVERNANCE_POLICY.md

4. BRAIN INITIALIZATION
   12 ERB modules (.agents/brain/)

5. SKILL SELECTION
   Capability Router -> repository-skills

6. EXECUTION & VERIFICATION
   docs:lint -> repository:doctor -> governance:all
```

### Problems:
- Step 1: No AGENTS.md (most agents expect this first)
- Step 2: Dual AI governance docs conflict
- Step 4: Static JSONs duplicate repository-brain/config
- Missing: **Conflict resolution step** — when docs disagree, agent has no guidance
- Missing: **Intention detection step** — no documented process for determining intent vs scope

---

## Top 10 Immediate Recommendations

| Priority | Action | Issues Solved | Effort |
|----------|--------|---------------|--------|
| 1 | Create AGENTS.md as first agent-load file | Missing SSOT | 0.5 day |
| 2 | Consolidate ADRs: pick `docs/architecture/adr/`, deprecate others | C-06, D-01 | 1 day |
| 3 | Merge AI governance: boundary -> operating instructions | C-04 | 1 day |
| 4 | Prune cleanup artifacts (~80 files), consolidate backlogs to 1 | D-02, D-03 | 1 day |
| 5 | Resolve branch strategy: pick CI_CD_SSOT model, deprecate others | C-01 | 0.5 day |
| 6 | Fix Tier 1 cap: reduce to 7 or update limit to 15 | C-05 | 0.5 day |
| 7 | Normalize `@mad/*` -> `@esparex/*` in all docs | C-02 | 0.5 day |
| 8 | Eliminate brain JSON duplication | D-04 | 1 day |
| 9 | Add workspace READMEs (core, backend, shared, packages) | Missing docs | 1 day |
| 10 | Parallelize CI, add npm audit, scope pre-commit | Tech debt | 3 days |

---

## Verification

After implementing any recommendation, verify by:

1. **AGENTS.md**: Load the file and confirm it provides: role definition, where to find SSOT docs, conflict resolution procedure
2. **ADR consolidation**: `find docs -name "ADR-*"` should return only `docs/architecture/adr/` entries
3. **Branch strategy SSOT**: `grep -r "branch" docs/governance/CI_CD_SSOT.md` should be the single reference
4. **Cleanup pruning**: `docs/cleanup/` should have 1 run, not 7
5. **JSON dedup**: Diff `.agents/brain/static/` vs `packages/repository-brain/config/` should show symlink or identical
