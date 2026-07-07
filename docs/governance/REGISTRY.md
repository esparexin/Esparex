# REGISTRY.md

- **Owner**: Principal Software Architect
- **Status**: Active
- **Version**: 1.0.0
- **Baseline Version**: 1
- **Last Updated**: 2026-07-03
- **Related Documents**:
  - [REPOSITORY_POLICY.md](./REPOSITORY_POLICY.md)
  - [BASELINE.md](./BASELINE.md)

---

## Purpose

This document defines the schema, rules, and APIs for the centralised Governance Rule Registry. The registry serves as the Single Source of Truth (SSOT) for all rule metadata, severities, owners, and policies in the MAD Entertrainment repository.

---

## Scope

This policy applies to all validation rules implemented in the governance engine, all metadata files under `scripts/governance/rules/metadata/`, and the rule resolution APIs.

---

## Registry Schema Definition

Every rule definition must comply with the following TypeScript interface structure:

```ts
export interface RuleDefinition {
  id: string;              // Unique rule ID (e.g. VAL-UI-010)
  name: string;            // Human-readable rule name
  description: string;     // Purpose and description of the rule
  category: RuleCategory;  // UI, UX, ACCESSIBILITY, SECURITY, PERFORMANCE, ARCHITECTURE, DOCUMENTATION, HYGIENE, REPOSITORY, INFRASTRUCTURE
  severity: RuleSeverity;  // INFO, WARNING, ERROR, CRITICAL
  confidence: number;      // Confidence index between 0.0 and 1.0
  owner: RuleOwner;        // Team/Guild responsible for this rule
  defaultStatus: string;   // Default lifecycle status (e.g. "NEW")
  ciPolicy: RuleCiPolicy;  // FAIL_BUILD, WARN, INFO_ONLY
  documentation: string;   // Absolute repository path to rule markdown (docs/governance/rules/...)
  remediation: string;     // Concise instruction to resolve findings
  supportsAutofix: boolean;// Whether automated fixes are supported
  version: string;         // Semantic version of this rule
  introducedVersion: string;// Version where this rule was added
  deprecatedVersion?: string;// Optional version where this rule was deprecated
  status: RuleStatus;      // ACTIVE, DEPRECATED, EXPERIMENTAL, DISABLED
  tags: string[];          // Arbitrary tags for metrics grouping
}
```

---

## Registry Rules

### RREG-001 — Central Registry SSOT
Rule metadata (such as severities, default statuses, or owners) must be declared exclusively in the registry files under `scripts/governance/rules/metadata/`. Defining or hardcoding rule metadata in validators or reporting components is strictly prohibited.

### RREG-002 — Failure on Duplicate
The registry loader API (`RuleRegistry.initialize()`) must fail fast and halt the process if a duplicate rule ID or duplicate rule name is registered.

### RREG-003 — Schema Constraints
All registered rules must pass strict schema validation at startup, including:
- Categories must belong to the approved set.
- Severities must belong to the approved set.
- Owners must belong to the approved set.
- Confidence must be a number between 0 and 1 inclusive.
- Documentation paths must reside under `docs/governance/rules/`.

---

## Allowed Practices

- Adding new metadata categories or owners by updating the validation sets in `scripts/governance/rules/registry.ts`.
- Fetching rules selectively via helper APIs: `getRule(id)`, `getAllRules()`, `getRulesByCategory(cat)`, `getRulesByOwner(owner)`, `getRulesBySeverity(sev)`, `getRulesByPolicy(policy)`.

---

## Forbidden Practices

- Initializing rule metadata inline inside validators.
- Defining a rule ID that is not unique across categories.
- Reference documentation paths outside the `docs/governance/rules/` workspace directory.

---

## Related Documents

- [REPOSITORY_POLICY.md](./REPOSITORY_POLICY.md)
- [BASELINE.md](./BASELINE.md)

---

## Revision History

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0.0 | 2026-07-03 | Principal Software Architect | Initial baseline for PR4 |
