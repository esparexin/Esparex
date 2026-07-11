---
MetadataSchema: 1.0
Brain-ID: ERB-010
Title: Brain Initialization
Version: 1.0
Status: Active
Type: Static
Owner: Agent Setup Rules
Canonical: true
Last Updated: 2026-07-07
Confidence: High
Maintenance: Manual
Validation:
  - npm run docs:lint
Relationships:
  documents:
    depends:
      - ERB-009
    impacts: []
  repository:
    consumes:
      - ai-governance/PROMPT_TEMPLATE.md
    owns:
      - Agent Onboarding Startup Rules
      - Backlog Opportunities Tracking
    validates:
      - Context Registry Coverage
    generates:
      - Agent Runtime Setup Commands
---

# 10. Brain Initialization

This document establishes the instructions and validation checks required to initialize developer agents.

## 1. Developer Agent Startup Rules
Every developer agent loading context in this repository must follow these rules:

1. **Obey the Documentation Hierarchy**: Refer strictly to `docs/MASTER_DOCUMENT_REGISTRY.md` to load canonical specifications.
2. **Obey Path Boundaries**: Restrict module imports based on rules registered in `ERB-005`.
3. **Run Lint Checks**: Run `npm run docs:lint` and `npm run repository:doctor -- --profile ci` to verify code hygiene before submitting PRs.
4. **Preserve Comments & Docs**: Do not delete unrelated comments or description blocks when modifying files.

---

## 2. Repository Improvement Opportunities

The following backlog tasks have been identified to improve code health and structural architecture:

### 2.1 Documentation Cleanups
* **Consolidate Drafts**: Register local draft files like `docs/PR4-DECISION-NEEDED.md`, `docs/remediation-plan.md`, and `docs/verification-results.md` in `docs/MASTER_DOCUMENT_REGISTRY.md` once finalized.
* **Archiving check**: Move any other deprecated runbooks or legacy audit reports into `/archive/legacy/` to keep `/docs` strictly focused on canonical SSOT content.

### 2.2 Tooling Improvements
* **Path cross-platform compatibility**: Maintain path normalization in `check-doc-duplicates.js` so validations continue to succeed cleanly across both Windows and Unix developer systems.

### 2.3 Fixtures Consolidation
* **Relocate smoke-fixtures.json**: Safely refactor `listingSmokeFixtures.ts` and `ensure-listing-smoke-fixtures.ts` to consume a unified config path (e.g. inside `shared/`) instead of relying on root file placement, allowing us to safely move `smoke-fixtures.json` out of the workspace root.

---

## 3. Evidence

* **Commit Fingerprint**: Verified against repo commit [d7e1faec](file:///c:/Users/Administrator/Documents/GitHub/Esparex)
* **Prompt templates mapping specifications**: [ai-governance/PROMPT_TEMPLATE.md](file:///c:/Users/Administrator/Documents/GitHub/Esparex/ai-governance/PROMPT_TEMPLATE.md)
* **Active rules pointer configuration**: [.cursorrules](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.cursorrules) and [.antigravity.system.prompt.md](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.antigravity.system.prompt.md)

---

## 4. Central Decisions References

* Central Decision Record: [0003-brain-system](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.agents/decisions/0003-brain-system.md)

---

## 5. Decision History

* **v1.0 (2026-07-07)**: Initialized agent startup instructions and backlog opportunities tracker.
