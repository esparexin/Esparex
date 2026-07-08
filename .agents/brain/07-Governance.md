---
MetadataSchema: 1.0
Brain-ID: ERB-007
Title: Governance
Version: 1.0
Status: Active
Type: Static
Owner: Automated Health Scoring Rules
Canonical: true
Last Updated: 2026-07-07
Confidence: High
Maintenance: Manual
Validation:
  - npm run docs:lint
  - npm run repository:doctor -- --profile ci
Relationships:
  documents:
    depends:
      - ERB-001
      - ERB-005
      - ERB-006
    impacts:
      - ERB-010
  repository:
    consumes:
      - packages/repository-governance/package.json
      - packages/repository-governance/src/scoring/index.ts
    owns:
      - Governance Analyzers Definitions
      - Health Deduction Metrics
    validates:
      - Unicode Hygiene Violations
      - Environment Setup Gaps
    generates:
      - Automated Health Scoring Rules
---

# 07. Governance

This document registers the automated repository governance toolset, scoring rules, and cli commands.

## 1. Custom Governance Platform
The project includes a custom programmatic governance builder package located at `@esparex/repository-governance` (configured in [packages/repository-governance](file:///c:/Users/Administrator/Documents/GitHub/Esparex/packages/repository-governance/package.json)).

### 1.1 Automated Analyzers
* `UnicodeHygieneAnalyzer`: Validates source files do not contain mid-file byte-order-marks (`U+FEFF`) or irregular space characters (`U+200B`).
* `GitAnalyzer`: Checks for uncommitted modifications and branch restrictions.
* `EnvAnalyzer`: Assures root and apps environment configurations presence (`.env` / `.env.example`).
* `ArchitectureAnalyzer`: Audits monorepo package imports, deep imports, circular dependencies, and public API namespace loads.

### 1.2 Automated CLI Command
To run validations locally or in the pipeline:
`npm run repository:doctor -- --profile ci`

---

## 2. Health Scoring Metrics
The health score starts at `100`. Deductions are calculated programmatically in [scoring/index.ts](file:///c:/Users/Administrator/Documents/GitHub/Esparex/packages/repository-governance/src/scoring/index.ts) based on validation results:

* **Critical failures**: `-50` (Blocks compilation / deployment)
* **Error-level failures**: `-15` (Fails PR checks)
* **Warning-level failures**: `-5` (Emits warnings, does not block build)
* **Info-level details**: `0`

$$\text{Health Score} = \max\left(0, 100 - \sum \text{Deductions}\right)$$
Overall Monorepo score is the rounded average of all checked profiles.

---

## 3. Evidence

* **Commit Fingerprint**: Verified against repo commit [d7e1faec](file:///c:/Users/Administrator/Documents/GitHub/Esparex)
* **Package setup parameters**: [packages/repository-governance/package.json](file:///c:/Users/Administrator/Documents/GitHub/Esparex/packages/repository-governance/package.json)
* **Scoring calculations algorithm**: [packages/repository-governance/src/scoring/index.ts](file:///c:/Users/Administrator/Documents/GitHub/Esparex/packages/repository-governance/src/scoring/index.ts)
* **CLI Command registration script**: [package.json#L96](file:///c:/Users/Administrator/Documents/GitHub/Esparex/package.json#L96)
* **Automated checks workflow**: [.github/workflows/ci.yml#L55-62](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.github/workflows/ci.yml#L55-62)

---

## 4. Central Decisions References

* Central Decision Record: [0001-governance-baseline](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.agents/decisions/0001-governance-baseline.md)
* Central Decision Record: [0003-brain-system](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.agents/decisions/0003-brain-system.md)

---

## 5. Decision History

* **v1.0 (2026-07-07)**: Initialized governance analyzers registry and scoring formulas.
