# AI Runtime & Governance Audit — Complete Classification

**Date:** 2026-07-08  
**Auditor:** AI Runtime Auditor  
**Status:** Audit Only — No mods, no deletions  

Performed following `AGENTS.md` as the ONLY SSOT entry point.

---

## 1. Active Runtime Graph

```
AGENTS.md (first file an agent loads)
  |
  v
MASTER_DOCUMENT_REGISTRY.md (SSOT of all docs)
  |
  +-> docs/ssot/ (4 Tier 1 SSOTs)
  |     DOMAIN_MODEL_SSOT.md       [ACTIVE]
  |     API_CONTRACT_SSOT.md       [ACTIVE]
  |     ARCHITECTURE_FLOW_SSOT.md  [ACTIVE]
  |     CI_CD_SSOT.md              [ACTIVE]
  |
  +-> docs/governance/AI_GOVERNANCE_BOUNDARY.md [ACTIVE]
  |
  +-> docs/governance/GOVERNANCE_POLICY.md [ACTIVE]
  |
  +-> .agents/brain/ (12 ERB modules) [ACTIVE]
  |
  +-> docs/AI_RUNTIME_SPEC.md [ACTIVE]
  |
  +-> docs/SSOT_INDEX.md [ACTIVE]

packages/ (code-level runtime):
  scanner -> brain -> governance -> skills -> intelligence
  plugin-sdk -> plugin-nextjs + plugin-security
  runtime (CLI with 11 commands)

IDE pointers:
  .cursorrules                    [ACTIVE - thin pointer]
  .antigravity.system.prompt.md   [ACTIVE - thin pointer]
```

---

## 2. Governance Dependency Graph

```
AI_GOVERNANCE_BOUNDARY.md (Tier 5 - AI boundary)
  |
  +-> .cursorrules (thin pointer, no independent logic)     [ACTIVE]
  +-> .antigravity.system.prompt.md (thin pointer)           [ACTIVE]
  +-> ai-governance/AI_CONTEXT.json                          [ACTIVE]
  +-> ai-governance/PROMPT_TEMPLATE.md                       [ACTIVE]

GOVERNANCE_POLICY.md (Tier 3 - Engineering policy)
  |
  +-> REPOSITORY_POLICY.md              [DUPLICATE - conflicts with above]
  +-> NAMING_CONVENTIONS.md             [ACTIVE]
  +-> FILE_LIFECYCLE.md                 [ACTIVE - has stale refs]
  +-> DEPENDENCY_POLICY.md              [ACTIVE - uses @mad/* names]
  +-> WORKSPACE_POLICY.md               [ACTIVE]
  +-> CANONICAL_OWNERSHIP_RULES.md      [ACTIVE]
  +-> BASELINE.md                       [ACTIVE]
  +-> GOVERNANCE_ARCHITECTURE.md        [MERGE CANDIDATE]
  +-> EXECUTION_ENGINE.md               [MERGE CANDIDATE]
  +-> EXECUTION_PIPELINE.md             [MERGE CANDIDATE]
  +-> GOVERNANCE_VERSION.md             [ACTIVE]
  +-> GOVERNANCE_REGISTRY.md            [MERGE CANDIDATE]
  +-> REGISTRY.md                       [MERGE CANDIDATE]
  +-> VALIDATOR_REGISTRY.md             [MERGE CANDIDATE]
  +-> ROADMAP.md                        [ACTIVE]
  +-> rules/ (86 rule definition files) [VERIFY - disconnected from TS code]
```

---

## 3. Skill Dependency Graph

### Three incompatible skill taxonomies found:

**A. Code-level (packages/repository-skills/src/skills/)** [ACTIVE]
   - `WorkspaceResolution` — resolves workspace metadata
   - `LayerResolution` — resolves architecture layer from file path
   - `TechnologyInspection` — returns technology versions from snapshot
   - `Scaffolding` — generates files (dryRun-safe)
   - **Loaded by:** `repository-runtime` CLI and SDK
   - **Confidence:** 100%

**B. Brain Skill Manifest (ERB-009 / `.agents/brain/09-Skill-Manifest.md`)** [ACTIVE]
   - 9 touchpoints: Next.js, React, Express, TypeScript, MongoDB/Mongoose, Razorpay, Repository Governance, Documentation, CI/CD
   - **Loaded by:** AI agents reading brain modules
   - **Confidence:** 95% — differs from code-level skills entirely

**C. MAD_AI_OPERATING_INSTRUCTIONS.md (now archived)** [ARCHIVED]
   - Caveman, GStack, Repository Governance, UI & UX, Humanizer
   - **Not loaded by anything** since archive
   - **Confidence:** 100% — confirmed archived

**Conflict:** Taxonomies A and B describe completely different skill sets for the same concept. No routing exists between the brain manifest's touchpoint categories and the code-level skill implementations.

---

## 4. Rule Dependency Graph

### Two disconnected rule systems:

**A. Markdown rules (`docs/governance/rules/`)**
   - ~86 rule definition files
   - Categories: VAL-UI (19), VAL-ARC (4), VAL-DOC (8), VAL-PFM (2), VAL-SEC (2), plus hygiene rules (BROKEN_*, DUPLICATE_*, MALFORMED_*, MISSING_*, etc.)
   - **Loaded by:** `docs:lint` validation script
   - **Referenced from:** MASTER_DOCUMENT_REGISTRY (auto-registered)
   - **Confidence:** 100% — actively registered

**B. TypeScript rule implementations (`packages/repository-governance/src/`)**
   - 4 analyzers: GitAnalyzer, EnvAnalyzer, UnicodeHygieneAnalyzer, ArchitectureAnalyzer
   - 4 validators: GitValidator, EnvValidator, UnicodeValidator, ArchitectureValidator
   - **Loaded by:** `architecture:check` via `repository-doctor` CLI
   - **Confidence:** 100%

**Finding:** No mapping exists between the 86 markdown rule files (VAL-UI-001 etc.) and the 4 TypeScript analyzers. They document different things entirely. The markdown rules are documentation-rules about document quality (broken anchors, malformed headings, duplicate ADR numbers). The TypeScript analyzers are code-rules about architecture (deep imports, circular deps, boundary violations, git branch policies).

---

## 5. Complete File Classification

### 5.1 AI Entry Point Chain

| File | Classification | Reason | Confidence |
|------|---------------|--------|------------|
| `AGENTS.md` | **ACTIVE** | SSOT entry point. Referenced by `.cursorrules`, `.antigravity.system.prompt.md`, AI_RUNTIME_SPEC.md | 100% |
| `docs/MASTER_DOCUMENT_REGISTRY.md` | **ACTIVE** | SSOT of all documents. Referenced by AGENTS.md, docs:lint | 100% |
| `docs/AI_RUNTIME_SPEC.md` | **ACTIVE** | Runtime specification. Referenced by MASTER_DOCUMENT_REGISTRY | 100% |
| `docs/SSOT_INDEX.md` | **ACTIVE** | SSOT index. Referenced by MASTER_DOCUMENT_REGISTRY | 100% |

### 5.2 IDE Pointers

| File | Classification | Reason | Confidence |
|------|---------------|--------|------------|
| `.cursorrules` | **ACTIVE** | Thin pointer, defers to AGENTS.md and MASTER_DOCUMENT_REGISTRY | 100% |
| `.antigravity.system.prompt.md` | **ACTIVE** | Thin pointer, same content as .cursorrules | 100% |

### 5.3 AI Governance Docs

| File | Classification | Reason | Confidence |
|------|---------------|--------|------------|
| `docs/governance/AI_GOVERNANCE_BOUNDARY.md` | **ACTIVE** | Tier 5 SSOT. Referenced by AGENTS.md, .cursorrules, SSOT_INDEX.md | 100% |
| `ai-governance/AI_CONTEXT.json` | **ACTIVE** | Machine-readable context. Authorized by boundary | 100% |
| `ai-governance/PROMPT_TEMPLATE.md` | **ACTIVE** | Prompt template. Authorized by boundary | 100% |
| `docs/governance/MAD_AI_OPERATING_INSTRUCTIONS.md` | **ARCHIVED** | Content merged into AI_GOVERNANCE_BOUNDARY.md. File lives at `docs/archive/ai/` | 100% |

### 5.4 Brain Modules

| File | Classification | Reason | Confidence |
|------|---------------|--------|------------|
| `.agents/brain/` (12 ERB modules) | **ACTIVE** | Core AI initialization. Referenced by AGENTS.md discovery order | 100% |
| `.agents/brain/static/architecture.json` | **DUPLICATE** | Same content as `packages/repository-brain/config/architecture.json` | 100% |
| `.agents/brain/static/coding_standards.json` | **DUPLICATE** | Same content as `packages/repository-brain/config/coding-standards.json` | 100% |
| `.agents/brain/static/policies.json` | **DUPLICATE** | Same content as `packages/repository-brain/config/policies.json` | 100% |
| `.agents/brain/static/vocabulary.json` | **DUPLICATE** | Same content as `packages/repository-brain/config/vocabulary.json` | 100% |
| `.agents/brain/brain.manifest.yml` | **ACTIVE** | Manifest registering all 12 brain modules | 100% |
| `.agents/brain/brain.manifest.json` | **ACTIVE** | JSON version of manifest | 100% |
| `.agents/decisions/0001-*` through `0003-*` | **ACTIVE** | Agent decision records | 100% |

### 5.5 Governance Policy Docs

| File | Classification | Reason | Confidence |
|------|---------------|--------|------------|
| `docs/governance/GOVERNANCE_POLICY.md` | **ACTIVE** | Tier 3 SSOT. Referenced by AGENTS.md | 100% |
| `docs/governance/REPOSITORY_POLICY.md` | **DUPLICATE** | Overlaps with GOVERNANCE_POLICY.md. Both claim authority | 95% |
| `docs/governance/NAMING_CONVENTIONS.md` | **ACTIVE** | Referenced by GOVERNANCE_POLICY.md | 100% |
| `docs/governance/FILE_LIFECYCLE.md` | **LEGACY** | References non-existent files (REPOSITORY_GOVERNANCE.md, AGENTS.MD) | 100% |
| `docs/governance/DEPENDENCY_POLICY.md` | **LEGACY** | Uses `@mad/*` naming (actual packages use `@esparex/*`) | 100% |
| `docs/governance/WORKSPACE_POLICY.md` | **ACTIVE** | Workshop boundary rules | 100% |
| `docs/governance/CANONICAL_OWNERSHIP_RULES.md` | **ACTIVE** | Ownership rules (ARCH-002) | 100% |
| `docs/governance/BASELINE.md` | **ACTIVE** | Governance baseline | 100% |
| `docs/governance/GOVERNANCE_ARCHITECTURE.md` | **MERGE CANDIDATE** | Overlaps with GOVERNANCE_POLICY.md | 95% |
| `docs/governance/EXECUTION_ENGINE.md` | **MERGE CANDIDATE** | Overlaps with EXECUTION_PIPELINE.md | 95% |
| `docs/governance/EXECUTION_PIPELINE.md` | **MERGE CANDIDATE** | Overlaps with EXECUTION_ENGINE.md | 95% |
| `docs/governance/GOVERNANCE_VERSION.md` | **ACTIVE** | Version tracking (v1.0) | 100% |
| `docs/governance/GOVERNANCE_REGISTRY.md` | **MERGE CANDIDATE** | Competing with other registries | 95% |
| `docs/governance/REGISTRY.md` | **MERGE CANDIDATE** | Overlaps with GOVERNANCE_REGISTRY.md | 95% |
| `docs/governance/VALIDATOR_REGISTRY.md` | **MERGE CANDIDATE** | Overlaps with other registries | 95% |
| `docs/governance/ROADMAP.md` | **ACTIVE** | Governance roadmap | 100% |
| `docs/governance/rules/` (86 files) | **ACTIVE** | Registered in MASTER_DOCUMENT_REGISTRY | 100% |
| `docs/governance/rules/README.md` | **ACTIVE** | Rules index | 100% |

### 5.6 SSOT Docs

| File | Classification | Reason | Confidence |
|------|---------------|--------|------------|
| `docs/ssot/DOMAIN_MODEL_SSOT.md` | **ACTIVE** | Tier 1 SSOT | 100% |
| `docs/ssot/API_CONTRACT_SSOT.md` | **ACTIVE** | Tier 1 SSOT | 100% |
| `docs/ssot/ARCHITECTURE_FLOW_SSOT.md` | **ACTIVE** | Tier 1 SSOT | 100% |
| `docs/ssot/CI_CD_SSOT.md` | **ACTIVE** | Tier 1 SSOT | 100% |
| `docs/architecture/PACKAGE_CONTRACT.md` | **ACTIVE** | Tier 1 SSOT | 100% |
| `docs/architecture/REPOSITORY_SINGLE_SOURCE_OF_TRUTH.md` | **ACTIVE** | Tier 1 registered | 100% |
| `docs/architecture/REPOSITORY_DIRECTORY_STANDARD.md` | **ACTIVE** | Tier 1 registered | 100% |
| `docs/architecture/CURRENT_ARCHITECTURE.md` | **ACTIVE** | Tier 1 registered | 100% |

### 5.7 ADR Files

| Path | Classification | Reason | Confidence |
|------|---------------|--------|------------|
| `docs/architecture/adr/ADR-001` through `ADR-005` | **ACTIVE** | Tier 1 canonical ADRs (core, shared, backend, boundaries, monorepo) | 100% |
| `docs/architecture/adr/ADR-006` through `ADR-007` | **ACTIVE** | Supporting (namespace lockdown, enforcement) | 100% |
| `docs/archive/adr/ADR-001` through `ADR-005` | **ARCHIVED** | Deliberately archived from cleanup Phase 1 | 100% |
| `docs/architecture/adr/ADR-001-ui-package-boundary` through `ADR-004-component-lifecycle` | **ORPHAN** | Not listed in ADR_INDEX.md. Possibly superseded | 85% |
| `docs/decisions/ADR-001` through `ADR-012` | **ACTIVE** | Different ADR system (MAD/decisions, not architecture) | 100% |

### 5.8 Repository-* Packages

| Package | Classification | Reason | Confidence |
|---------|---------------|--------|------------|
| `packages/repository-scanner/` | **ACTIVE** | Only fs-touching package. Used by brain, runtime | 100% |
| `packages/repository-brain/` | **ACTIVE** | Knowledge compilation -> BrainSnapshot. Used by governance, skills, runtime | 100% |
| `packages/repository-skills/` | **ACTIVE** | Skill implementations. Used by runtime | 100% |
| `packages/repository-governance/` | **ACTIVE** | Rules engine. Wired to `architecture:check`, `repository:doctor` | 100% |
| `packages/repository-intelligence/` | **ACTIVE** | Health scores, recommendations, tech debt | 100% |
| `packages/repository-plugin-sdk/` | **ACTIVE** | Types-only contract SDK. Used by runtime, plugin-* | 100% |
| `packages/repository-plugin-nextjs/` | **UNUSED** | Implemented with tests but never imported by any consumer | 95% |
| `packages/repository-plugin-security/` | **UNUSED** | Implemented with tests but never imported by any consumer | 95% |
| `packages/repository-runtime/` | **ACTIVE** | Top-level SDK + CLI. Wired to `repository-doctor` script | 100% |

### 5.9 CI / GitHub Files

| File | Classification | Reason | Confidence |
|------|---------------|--------|------------|
| `.github/workflows/ci.yml` | **ACTIVE** | Main CI workflow | 100% |
| `.github/workflows/actionlint.yml` | **ACTIVE** | Workflow linting | 100% |
| `.github/workflows/commitlint.yml` | **ACTIVE** | Commit message validation | 100% |
| `.github/workflows/danger.yml` | **ACTIVE** | DangerJS PR checks | 100% |
| `.github/workflows/governance-health.yml` | **ACTIVE** | Governance file existence check | 100% |
| `.github/workflows/labeler.yml` | **ACTIVE** | Auto-labeling PRs | 100% |
| `.github/workflows/pr-title.yml` | **ACTIVE** | PR title validation | 100% |
| `.github/workflows/release-drafter.yml` | **ACTIVE** | Release draft creation | 100% |
| `.github/workflows/scorecard.yml` | **ACTIVE** | OpenSSF Scorecard | 100% |
| `.github/workflows/security.yml` | **ACTIVE** | CodeQL, Gitleaks, Dependency Review | 100% |
| `.github/workflows/stale.yml` | **ACTIVE** | Stale issue/PR management | 100% |
| `.github/dependabot.yml` | **ACTIVE** | Weekly npm + monthly GHA updates | 100% |
| `.github/policies/*` (5 files) | **ACTIVE** | Branch, review, release, dependency, security policies | 100% |
| `.github/CODEOWNERS` | **ACTIVE** | Path-based team ownership | 100% |
| `.github/PULL_REQUEST_TEMPLATE.md` | **ACTIVE** | PR template | 100% |

### 5.10 .cursor/ Directory

| Path | Classification | Reason | Confidence |
|------|---------------|--------|------------|
| `.cursor/` | **DOES NOT EXIST** | No .cursor directory found | 100% |
| `.cursor/rules/` | **DOES NOT EXIST** | No cursor rules directory | 100% |

### 5.11 Root Generated Files

| File | Classification | Reason | Confidence |
|------|---------------|--------|------------|
| `.architecture-dashboard.md` | **GENERATED - REMOVED** | Removed in final cleanup commit | 100% |
| `.architecture-report.md` | **GENERATED - REMOVED** | Removed in final cleanup commit | 100% |
| `tech-debt-insights.md` | **GENERATED - REMOVED** | Removed in final cleanup commit | 100% |

---

## 6. Delete Candidates

| Item | Reason | Confidence |
|------|--------|------------|
| `docs/architecture/adr/ADR-001-ui-package-boundary.md` through ADR-004-component-lifecycle.md | Orphan ADRs — not in ADR_INDEX, no references | 85% |
| `packages/repository-plugin-nextjs/` | Implemented but never consumed. If confirmed unused, could be removed | 95% |
| `packages/repository-plugin-security/` | Implemented but never consumed. If confirmed unused, could be removed | 95% |
| `.agents/brain/static/*.json` (4 files) | Exact duplicates of `packages/repository-brain/config/*.json` | 100% |

## 7. Merge Candidates

| Items | Target | Reason | Confidence |
|-------|--------|--------|------------|
| `GOVERNANCE_ARCHITECTURE.md` -> | `GOVERNANCE_POLICY.md` | Overlapping content | 95% |
| `EXECUTION_ENGINE.md` + `EXECUTION_PIPELINE.md` -> | Single pipeline doc | Overlapping descriptions | 95% |
| `GOVERNANCE_REGISTRY.md` + `REGISTRY.md` + `VALIDATOR_REGISTRY.md` -> | `MASTER_DOCUMENT_REGISTRY.md` | Registry consolidation | 95% |
| 3 skill taxonomies -> | Single taxonomy in ERB-009 | Incompatible descriptions of same concept | 95% |
| `REPOSITORY_POLICY.md` -> | `GOVERNANCE_POLICY.md` | Dual policy masters | 95% |

## 8. Keep Candidates (verified active)

| Item | Why Kept |
|------|----------|
| All 12 brain modules (ERB-000 through ERB-011) | Core AI initialization per AGENTS.md discovery order |
| All 4 SSOT docs (docs/ssot/) | Tier 1 Canonical |
| AI_GOVERNANCE_BOUNDARY.md | Tier 5 Canonical |
| AGENTS.md | First file agents load |
| AI_RUNTIME_SPEC.md | Runtime specification |
| SSOT_INDEX.md | Consolidated SSOT index |
| MASTER_DOCUMENT_REGISTRY.md | SSOT of all documents |
| GOVERNANCE_POLICY.md | Tier 3 Canonical |
| PACKAGE_CONTRACT.md | Tier 1 Canonical |
| All 11 GitHub workflows | All validated, no regressions |
| .cursorrules | Thin pointer (correct pattern) |
| .antigravity.system.prompt.md | Thin pointer (correct pattern) |
| packages/repository-* (active packages) | Core governance engine |
| docs/governance/rules/ (86 files) | Registered in master registry, validated by docs:lint |

## 9. Verification Required

| Item | What to Verify | Confidence |
|------|----------------|------------|
| 4 orphan architecture ADRs | Check if referenced by any doc, ADR_INDEX, or cross-link | 85% |
| plugin-nextjs + plugin-security | Confirm no runtime plugin registry wires them in dynamically | 95% |
| 4 brain JSON duplicates | Confirm which location is authoritative (brain/static vs brain/config) | 100% |

---

## 10. Conflicts Found (unresolved)

| Conflict | Severity | Details |
|----------|----------|---------|
| Dual policy masters: GOVERNANCE_POLICY vs REPOSITORY_POLICY | **HIGH** | Both claim Layer 3 authority. One should be canonical, the other deprecated. |
| Triple ADR numbering | **HIGH** | ADR-001 through ADR-005 exist in `docs/archive/adr/`, `docs/architecture/adr/`, and `docs/decisions/`. Archived copy is harmless. Architecture vs decisions still collide. |
| Dual skill taxonomies | **MEDIUM** | Brain manifest (ERB-009) defines touchpoint-based skills. repository-skills code defines operation-based skills. No mapping exists. |
| Disconnected rule systems | **MEDIUM** | 86 markdown rules (document quality) have no relation to 4 TypeScript analyzers (architecture quality). Both are "rules" but describe entirely different domains. |
| Branch strategy inconsistency | **MEDIUM** | 5 different branch models across 6+ documents. CI_CD_SSOT model is most practical. |

---

## 11. AI Execution Flow (Recommended)

```
1. AGENTS.md
   -> MASTER_DOCUMENT_REGISTRY.md
   -> AI_GOVERNANCE_BOUNDARY.md

2. TIER 1 SSOTs
   -> 4 docs/ssot/ docs
   -> PACKAGE_CONTRACT.md

3. GOVERNANCE
   -> GOVERNANCE_POLICY.md
   -> docs/governance/NAMING_CONVENTIONS.md

4. BRAIN INITIALIZATION
   -> 12 ERB modules (.agents/brain/)

5. SKILL SELECTION
   -> repository-skills (code implementations)
   -> ERB-009 (brain manifest for context)

6. EXECUTION & VERIFICATION
   -> docs:lint -> guard:dead-code -> governance:guards -> architecture:check

7. CONFLICT RESOLUTION
   Tier 1 SSOTs > all other docs
   Source code > docs
   If conflict persists: file an issue, do not silently override
```

---

## 12. Summary Statistics

| Category | Count |
|----------|-------|
| ACTIVE AI entry point files | 3 (AGENTS.md, AI_RUNTIME_SPEC.md, SSOT_INDEX.md) |
| ACTIVE SSOT docs | 12 (4 ssot + 5 architecture docs + PACKAGE_CONTRACT + AI_GOVERNANCE + GOVERNANCE_POLICY) |
| ACTIVE brain modules | 12 |
| ACTIVE governance config docs | 10 |
| ACTIVE rules | 86 markdown + 4 TS analyzers |
| ACTIVE skills | 4 code-level skills + 9 brain manifest touchpoints |
| ACTIVE workflows | 11 |
| EMPTY directories | 0 |
| DELETE candidates | 2 packages + 4 ADRs + 4 duplicate JSON files |
| MERGE candidates | 5 operations |
| ARCHIVED | 2 sets (MAD_AI doc, 5 ADRs) |
| DUPLICATE | 4 JSON files + 1 policy doc |
| UNRESOLVED CONFLICTS | 5 |
| Confidence >= 95% | All classifications |
