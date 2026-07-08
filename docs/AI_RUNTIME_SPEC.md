# AI_RUNTIME_SPEC.md — AI Runtime Specification

**Status:** Active  
**Owner:** platform-team  
**Last Updated:** 2026-07-08  

This document defines the runtime architecture, execution flow, and API for the Esparex repository AI governance system.

---

## 1. Architecture

The AI runtime is built on 9 packages in the `packages/repository-*` stack:

```
repository-scanner (filesystem discovery)
        |
repository-brain (knowledge compilation -> BrainSnapshot)
        |
repository-skills  repository-governance  repository-intelligence
        |                    |                       |
        +--------------------+-----------------------+
                             |
repository-plugin-sdk -> repository-plugin-nextjs, repository-plugin-security
                             |
repository-runtime (SDK + CLI + drift detection + AI assistant)
```

### 1.1 Data Flow

1. **Scanner** discovers files, git state, and workspace structure. Produces `RepositoryInventory`.
2. **Brain** compiles inventory through providers into a frozen, validated `BrainSnapshot`.
3. **Governance** runs analyzers + validators against the snapshot. Produces `GovernanceSummaryReport`.
4. **Intelligence** consumes governance results + snapshot to produce health scores and recommendations.
5. **Skills** are autonomous actions operating solely on snapshot data. Executed via capability routing.
6. **Runtime** orchestrates the full pipeline. Provides CLI (`repository-runtime`) with 11 commands.

### 1.2 Key Design Rules

| Rule | Description |
|------|-------------|
| Only scanner touches filesystem | All other packages consume snapshots or passed data |
| BrainSnapshot is frozen | Deep-frozen and Zod-validated before any consumer sees it |
| Skills are snapshot-driven | Every skill derives knowledge from `SkillContext.snapshot`, no `process.cwd()` |
| Plugins receive injected API | `RepositoryRuntimeApi` is injected into plugins, not self-discovered |

---

## 2. Execution Flow

```
1. CONTEXT DISCOVERY
   AGENTS.md -> MASTER_DOCUMENT_REGISTRY.md -> AI_GOVERNANCE_BOUNDARY.md

2. GOVERNANCE DISCOVERY
   AI_GOVERNANCE_BOUNDARY.md -> Prompt template -> Tier 1 SSOTs

3. BRAIN INITIALIZATION
   12 ERB modules (.agents/brain/)

4. SKILL SELECTION
   Capability Router -> repository-skills

5. EXECUTION & VERIFICATION
   docs:lint -> guard:dead-code -> governance:guards -> architecture:check
```

---

## 3. CLI Reference (repository-runtime)

| Command | Action | 
|---------|--------|
| `status` | Shows baseline snapshot identity + branch |
| `health` | Multi-dimensional health score |
| `scan` | Dumps raw inventory |
| `validate` | Governance compliance check |
| `drift` | Structural/policy drift detection |
| `explain` | Explains why validations failed |
| `history` | Historical health scores |
| `scaffold <ws> <file>` | Generates a file |
| `ask <instruction>` | AI assistant (dry-run by default) |
| `insights` | Full technical debt + stability + trends |
| `doctor` | Full diagnosis with recommendations |

---

## 4. Governance Profiles

| Profile | Analyzers | When |
|---------|-----------|------|
| `quick` | git + env | Pre-commit fast check |
| `doctor` | env + git | Diagnostic mode |
| `ci` | unicode-hygiene + git + architecture | CI pipeline |

---

## 5. Skill Taxonomy

All skills are defined in `packages/repository-skills/src/skills/`:

| Skill | Input | Output |
|-------|-------|--------|
| WorkspaceResolution | Snapshot | Workspace metadata, path |
| LayerResolution | File path | Architecture layer, boundaries |
| TechnologyInspection | - | Technology versions from snapshot |
| Scaffolding | Workspace + file spec | Generated file (dryRun-safe) |

---

## 6. Health Scoring

Health = `governance * 0.4 + drift * 0.3 + techDebt * 0.3`

| Threshold | Label |
|-----------|-------|
| >= 80 | Healthy |
| >= 65 | Warning |
| < 65 | Error |
