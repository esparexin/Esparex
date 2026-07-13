---
name: esparex_engineering_stack
description: Technical guidelines, authoritative frameworks, library boundaries, and implementation patterns for the Esparex Platform.
---

# Esparex Engineering Stack Skill

## Purpose
This skill establishes the authoritative engineering contract, library limits, and runtime expectations for the Esparex monorepo. It ensures that all code alterations maintain framework consistency, avoid architectural drift, and follow approved implementation patterns.

## Scope & Responsibility
- **Owns**:
  - Approved framework configurations and workspace assignments.
  - Allowed and prohibited third-party package matrices.
  - Canonical code execution flows (Form → RHF → Shared Zod → API → Core Service → DB).
  - Environment-specific linting, compiling, and testing tooling constraints.
- **Does NOT Own**:
  - General workspace governance (handled by `GOVERNANCE.md`).
  - Form UI accessibility, CSS transitions, responsive spacing (handled by `ui_ux` skill).
  - API security session policies or routing guards (handled by Security Governance).
  - General step-by-step AI workflows (handled by `AI_WORKFLOW.md`).
  - Infrastructure, pipelines, and server provisioning actions.

---

## Directives
Before executing any task involving code changes:
1. Resolve the specific workspace boundaries by loading [frameworks.md](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.agents/skills/esparex_engineering_stack/references/frameworks.md).
2. Validate that the proposed library or API client is not banned in [prohibited.md](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.agents/skills/esparex_engineering_stack/references/prohibited.md).
3. Follow the canonical execution steps defined in [patterns.md](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.agents/skills/esparex_engineering_stack/references/patterns.md).
4. Verify conformity using the validation checklists in [checklists/](file:///c:/Users/Administrator/Documents/GitHub/Esparex/.agents/skills/esparex_engineering_stack/checklists/).
