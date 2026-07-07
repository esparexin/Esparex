# BASELINE.md

- **Owner**: Principal Software Architect / Governance Team
- **Status**: Active
- **Version**: 1.0.0
- **Baseline Version**: 1
- **Last Updated**: 2026-07-03
- **Related Documents**:
  - [REPOSITORY_POLICY.md](./REPOSITORY_POLICY.md)
  - [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md)

---

## Purpose

This document defines the schema, structure, and evolution rules for the machine-readable governance baseline (`.governance/baseline.json`). The baseline acts as the system boundary declaration, allowing automated audits to validate the codebase state against policy definitions.

---

## Scope

This policy governs the schema, modification process, and consumption of the `.governance/baseline.json` file.

---

## Baseline Schema Definition

The machine-readable baseline file must reside at `.governance/baseline.json` and must comply with the following structure:

```json
{
  "governanceVersion": "1.0.0",
  "baselineVersion": 1,
  "repositoryName": "MAD-Entertrainment",
  "defaultBranch": "develop",
  "productionBranch": "live",
  "workspaces": {
    "apps": ["admin", "server", "web"],
    "packages": ["shared", "types", "ui", "utils", "validations"]
  },
  "requiredFiles": [
    "package.json",
    "pnpm-workspace.yaml",
    "turbo.json",
    "README.md",
    "REPOSITORY_GOVERNANCE.md",
    "AGENTS.MD",
    "CHANGELOG.md"
  ],
  "ignoredPaths": [
    "node_modules",
    "dist",
    "coverage",
    ".next",
    ".turbo",
    "reports"
  ]
}
```

### Schema Key Descriptions

- `governanceVersion`: The semantic version of the governance engine specification.
- `baselineVersion`: The monotonic integer representing the iteration of the baseline policies.
- `workspaces.apps`: The exact list of folders in `apps/` allowed to participate in compilation.
- `workspaces.packages`: The exact list of folders in `packages/` allowed to participate in compilation.
- `requiredFiles`: Root-level files that must exist and be tracked under git.
- `ignoredPaths`: Directories that must be ignored by git and skipped by the governance engine parser.

---

## Versioning & Evolution Rules

### B-001 — Monotonic Versioning
The `baselineVersion` must increment by exactly `1` whenever a new workspace is added, a required file is added or removed, or a branch structure changes.

### B-002 — Additive Workspace Policy
Adding a new workspace to `baseline.json` requires:
1. Creating the folder structure inside `apps/` or `packages/`.
2. Documenting the folder's purpose in `REPOSITORY_STRUCTURE.md`.
3. Declaring the workspace name in `baseline.json` and incrementing the `baselineVersion`.

---

## Allowed Practices

- Modifying `baseline.json` inside a pull request that introduces a new workspace.
- Using `baseline.json` as a static configuration in CI scripts to check that no untracked folders have been created.

---

## Forbidden Practices

- Manually modifying the schema structure of `baseline.json` (such as changing key names) without updating `governanceVersion`.
- Adding local development workspace names or temporary paths to the baseline list.

---

## Related Documents

- [REPOSITORY_POLICY.md](./REPOSITORY_POLICY.md)
- [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md)

---

## Revision History

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0.0 | 2026-07-03 | Principal Software Architect | Initial baseline for PR3 |
