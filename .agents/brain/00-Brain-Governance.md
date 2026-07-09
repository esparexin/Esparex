---
MetadataSchema: 1.0
Brain-ID: ERB-000
Title: Brain Governance
Version: 1.0
Status: Active
Type: Static
Owner: Brain Governance Board
Canonical: true
Last Updated: 2026-07-07
Confidence: High
Maintenance: Manual
Validation:
  - npm run docs:lint
Relationships:
  documents:
    depends:
      - ERB-001
      - ERB-010
    impacts:
      - ERB-001
      - ERB-010
  repository:
    consumes:
      - package.json
    owns:
      - Brain Authoring Standards
      - Facts vs Declarative Policies Separation Rules
      - Static vs Derived Brain Principles
    validates:
      - Metadata Completeness
      - Reference Resolvability
      - Evidence Anchoring
    generates:
      - AI Context Validation
---

# 00. Brain Governance

This document establishes the metadata, formatting constraints, verification rules, and evolution policies for the repository's AI Brain modules.

## 1. Document Requirements

Every document in the `.agents/brain/` directory must contain the following structural properties:

### 1.1 YAML Frontmatter Metadata
Each file must begin with a YAML block containing:
* `MetadataSchema`: Version of the metadata schema (currently `1.0`).
* `Brain-ID`: Unique project-specific identifier (e.g. `ERB-000`).
* `Title`: Title of the document.
* `Version`: Semantic version of the document.
* `Status`: Lifecycle status (`Draft` \| `Active` \| `Deprecated` \| `Archived`).
* `Type`: Review frequency group (`Static` \| `Dynamic`).
* `Owner`: Mapped repository owner layer.
* `Canonical`: A boolean declaring if it is the Single Source of Truth (`true`).
* `Last Updated`: YYYY-MM-DD timestamp.
* `Confidence`: Verified status (`High` \| `Medium` \| `Low` \| `Unknown`).
* `Maintenance`: Type of updates (`Manual` \| `Generated`).
* `Validation`: Command list used to verify assertions in the file.
* `Relationships`: Structured mappings detailing document dependencies and repository touchpoints.

### 1.2 Separation of Facts vs. Declarative Policies
* **Facts**: Observable repository states, directories, package versions, and environment configurations. Must carry an explicit **Evidence** section.
* **Declarative Policies**: Structural boundaries declarations (e.g. "Presentation layer must not access Core layer") and coding conventions.
* **Verification Algorithms**: How policies are verified (e.g. AST analysis, linter algorithms, check scripts) must live in the **Governance** layer, keeping the Brain purely declarative.

### 1.3 Static vs. Generated (Derived) Brain Data
* **Static Brain (Human-Authored)**: Documents conveying intent, architectural philosophy, vocabulary glossary, and declarative policies that cannot be programmatically inferred.
* **Generated Brain (Derived)**: Inventories and graphs derived automatically by scanning the codebase (e.g., packages version mappings, directory files logs, imports dependency maps).

---

## 2. Integrity & Validation Rules

### BG-001 — Document Ownership Purity (Canonical Invariant)
Every repository fact and declarative policy must have exactly one canonical owner in the Brain. No two Brain documents may claim ownership of the same rule.

### BG-002 — Evidence Enforcement
Every repository fact stated in the Brain must include a corresponding entry in a `## Evidence` section citing the exact source file in the repository verified against the commit fingerprint.

### BG-003 — Acyclic Dependency Model
Skills and Governance layers depend on the Brain API, but the Brain depends on nothing.

### BG-004 — Derived Authorship Principle
* **Statement**: The Brain is authoritative, but not necessarily authoritative by manual authorship.
* **Details**: Repository facts must be generated programmatically from repository metadata (such as `package.json`, workflow configs, folder structures) whenever possible. Manual authoring is reserved exclusively for policies, intent, or design decisions that cannot be inferred automatically.

---

## 3. Evidence

* **Commit Fingerprint**: Verified against repo commit [d7e1faec](file:///c:/Users/Administrator/Documents/GitHub/Esparex)
* **Linter config**: Checked by [check-doc-duplicates.js](file:///c:/Users/Administrator/Documents/GitHub/Esparex/scripts/check-doc-duplicates.js)

---

## 4. Central Decisions References

* Central Decision Record: [0003-brain-system](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.agents/decisions/0003-brain-system.md)

---

## 5. Decision History

* **v1.0 (2026-07-07)**: Initialized Brain Governance configuration to enforce ID tracking and commit fingerprint verification.
* **v1.1 (2026-07-07)**: Refined boundaries separating Declarative Policies from Verification Algorithms, and codified the Canonical Invariant.
* **v1.2 (2026-07-07)**: Codified Static vs. Generated boundaries and the Derived Authorship Principle.
