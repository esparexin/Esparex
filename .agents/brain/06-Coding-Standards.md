---
MetadataSchema: 1.0
Brain-ID: ERB-006
Title: Coding Standards
Version: 1.0
Status: Active
Type: Static
Owner: Coding Style Standards
Canonical: true
Last Updated: 2026-07-07
Confidence: High
Maintenance: Manual
Validation:
  - npm run lint
  - npm run docs:lint
Relationships:
  documents:
    depends:
      - ERB-001
    impacts:
      - ERB-007
  repository:
    consumes:
      - docs/governance/GOVERNANCE_POLICY.md
      - eslint.config.mjs
    owns:
      - Code Casing Standards
      - Type Safety Constraints
    validates:
      - Any Type Usage
      - Speculative Downstream Checks
    generates:
      - Coding & Typing Style Standards
---

# 06. Coding Standards

This document registers the coding conventions, type rules, and file naming standards.

## 1. Type Safety & TypeScript
* **No Speculative Patches**: Do not add downstream safety-checks to mask upstream data errors. All bugs must be resolved at their source.
* **No `any` Type**: Usage of `any` is prohibited. Variables, parameters, return signatures, and models must carry explicit type definitions.
* **No Null Assertion**: Avoid using the non-null assertion operator (`!`). Always use optional chaining (`?.`) or provide a default fallback value.
* **Lint checks**: Checked by ESLint rules `@typescript-eslint/no-unused-vars` and `unused-imports/no-unused-imports` to block dead imports/variables.

---

## 2. Casing & Naming Rules
* **`camelCase`**: Mandatory for variables, function names, properties, utilities, and script files (e.g. `check-doc-duplicates.js`).
* **`PascalCase`**: Mandatory for class names, React components, and component files (e.g. `StatusBanner.tsx`).
* **Boolean Casing**: Boolean variables and fields must carry a descriptive indicator prefix (`is`, `has`, `can`, e.g. `isActive`, `hasAccess`, `canWrite`).
* **Singular DB Casing**: Database models and Mongoose collections must be strictly **Singular** (e.g., `User`, `Location`).
* **Plural Route Casing**: REST API route endpoints and collections parameters must be strictly **Plural** (e.g., `/api/v1/users`, `/api/v1/locations`).

---

## 3. Evidence

* **Commit Fingerprint**: Verified against repo commit [d7e1faec](file:///c:/Users/Administrator/Documents/GitHub/Esparex)
* **Coding guidelines policy**: [docs/governance/GOVERNANCE_POLICY.md](file:///c:/Users/Administrator/Documents/GitHub/Esparex/docs/governance/GOVERNANCE_POLICY.md)
* **ESLint rules and globals config**: [eslint.config.mjs#L44-84](file:///c:/Users/Administrator/Documents/GitHub/Esparex/eslint.config.mjs#L44-84)
* **File naming enforcer**: [scripts/enforce-file-naming-conventions.js](file:///c:/Users/Administrator/Documents/GitHub/Esparex/scripts/enforce-file-naming-conventions.js)

---

## 4. Central Decisions References

* Central Decision Record: [0003-brain-system](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.agents/decisions/0003-brain-system.md)

---

## 5. Decision History

* **v1.0 (2026-07-07)**: Initialized coding styling and typing rules layout.
