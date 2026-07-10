---
MetadataSchema: 1.0
Brain-ID: ERB-009
Title: Skill Manifest
Version: 1.0
Status: Active
Type: Static
Owner: Skill Selection Manifest
Canonical: true
Last Updated: 2026-07-07
Confidence: High
Maintenance: Manual
Validation:
  - npm run docs:lint
Relationships:
  documents:
    depends:
      - ERB-002
      - ERB-003
    impacts:
      - ERB-010
  repository:
    consumes:
      - ai-governance/AI_CONTEXT.json
    owns:
      - Capability Routing Matrix
      - Skills Selection Automation
    validates:
      - Request Touchpoints Matching
    generates:
      - Agent Skill Selection Manifest
---

# 09. Skill Manifest

This document registers the capability routing engine that identifies the required knowledge layers and developer skills based on user requests.

## 1. Capability Routing Workflow

Developer agents must resolve tasks by transitioning through the capability routing pipeline:

```text
  [ User Request ]
         │
         ▼
  [ Capability Detection ]         # Identify if Frontend, Backend, Core, or infra task
         │
         ▼
  [ Required Repo Knowledge ]      # Map to specific Brain files (e.g. 05-Dependency, 06-Coding)
         │
         ▼
  [ Required Skills Selection ]    # Select and load recommended skills
         │
         ▼
  [ Execution Steps Sequence ]     # Run builds & checks sequentially (type-check, test)
         │
         ▼
  [ Automated Verification ]       # Run docs:lint and repository:doctor
```

---

## 2. Skill Mapping Matrix

All skills are implemented in `packages/repository-skills/src/skills/`. The capability router matches request scopes to skills based on target folder touchpoints:

| Touchpoint Folder Path | Required Capability | Skills to Load |
| :--- | :--- | :--- |
| `packages/repository-*` | Repository Governance | **WorkspaceResolution**, **LayerResolution**, **TechnologyInspection**, **Scaffolding** |
| `apps/web/src` | Client Presentation | **TechnologyInspection**, **LayerResolution** |
| `apps/admin/src` | Admin Presentation | **TechnologyInspection**, **LayerResolution** |
| `backend/api/src` | API Transport Gateway | **LayerResolution**, **TechnologyInspection** |
| `core/src` | Domain & Business Logic | **LayerResolution**, **TechnologyInspection** |
| `shared/src` | Contracts & Types | **LayerResolution** |
| `docs/` | Documentation | None (SSOT-first, no skill needed) |
| `.github/workflows` | CI/CD | None (CI is automated) |

---

## 3. Evidence

* **Commit Fingerprint**: Verified against repo commit [d7e1faec](file:///c:/Users/Administrator/Documents/GitHub/Esparex)
* **AI Context routing config**: [ai-governance/AI_CONTEXT.json](file:///c:/Users/Administrator/Documents/GitHub/Esparex/ai-governance/AI_CONTEXT.json)
* **Workspaces lists definitions**: [package.json#L9-16](file:///c:/Users/Administrator/Documents/GitHub/Esparex/package.json#L9-16)

---

## 4. Central Decisions References

* Central Decision Record: [0003-brain-system](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.agents/decisions/0003-brain-system.md)

---

## 5. Decision History

* **v1.0 (2026-07-07)**: Initialized capability-routing workflow.
