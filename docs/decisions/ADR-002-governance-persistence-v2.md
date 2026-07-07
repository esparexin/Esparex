# ADR-002: Governance Finding Persistence v2

## Metadata
- **Status**: Implemented
- **Date**: 2026-07-01
- **Authors**: AI Architecture Agent & Repository Owner
- **Reviewers**: Principal Software Architect
- **Decision Category**: Governance
- **Related Documents**: [REPOSITORY_GOVERNANCE.md](../../REPOSITORY_GOVERNANCE.md), [ARCHITECTURE.md](../../ARCHITECTURE.md)
- **Related GitHub Issues**: None
- **Related Pull Requests**: None

---

## Context
The repository utilizes an automated governance and auditing subsystem that scans the codebase for visual, styling, accessibility, and documentation violations. When a violation is found, a separate JSON file is generated under `.governance/findings/` and `.governance/history/` to track its lifecycle.

## Problem Statement
Because the UI codebase currently contains 200+ raw button and table occurrences violating rule `VAL-UI-010`, the findings engine generates over 200 separate JSON files. This results in significant file proliferation, filesystem overhead, and excessive Git diff noise during code changes. Furthermore, line-number changes cause findings to churn and re-trigger as false positive regressions.

## Decision
Refactor the governance finding persistence engine to:
1. **Group occurrences** of the same rule within the same file path into a single aggregated finding JSON file.
2. Store findings using **SHA-256 stable hashed IDs** (`f_` + truncated 8-character hash of `rule + path`) inside directory subfolders categorized by lifecycle state:
   - `findings/active/` for open violations
   - `findings/closed/` for resolved violations (archived after configurable threshold)
   - `findings/suppressed/` for whitelisted exceptions
3. Implement **fingerprint-based occurrence tracking** utilizing whitespace-stripped, normalized hashes of the JSX elements to prevent line-shift churn.
4. Maintain a `.governance/manifest.json` file as the Single Source of Truth for the findings status, schema, and performance metrics.
5. Record immutable history logs as daily snapshot files (e.g. `history/YYYY-MM-DD.json`).

## Alternatives Considered
- **Alternative A**: *Retain current flat layout*. Pros: simple directory indexing. Cons: high git noise, filesystem bloat.
- **Alternative B**: *Git-ignore all findings*. Pros: zero git noise. Cons: destroys the ability to track finding lifecycles and technical debt trends across environments.

## Consequences
- **Pros**:
  - Reduces JSON file count by 85%+ (from 200+ down to ~25).
  - Resilient to line shifts.
  - Clear state separation (`active`, `closed`, `suppressed`).
  - Auditable daily history records.
- **Cons**:
  - Adds schema complexity and requires a migration step.

---

## Technical & Operational Impact

### Migration Strategy
A safe migration utility (`scripts/governance/migrate-findings.ts`) will backup the legacy layout, group occurrences, match them by fingerprint, and verify integrity before deleting legacy files.

### Operational Impact
Adds `.governance/manifest.json` to track system health and run performance metrics.

### Security Impact
None. The subsystem runs locally and in CI.

### Performance Impact
Reduces disk I/O significantly by consolidating file writes.

### Testing Strategy
Verify via a dry-run migration check and count integrity matrix assertions (ensuring zero lost occurrences).

### Rollback Strategy
If validation fails, restore files from `.governance/migration-backup/` and log `FailureRecoveryMetadata` to `.governance/migration-failure.json`.

---

## Future Considerations
- Evaluate expanding the hybrid cache validation (PERF-019) to additional resource-intensive subsystems.
- Review retention policy thresholds as the governance findings database grows.

## References
- [REPOSITORY_GOVERNANCE.md](../../REPOSITORY_GOVERNANCE.md)
- [ARCHITECTURE.md](../../ARCHITECTURE.md)
