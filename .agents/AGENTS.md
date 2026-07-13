---
id: agents-bootstrap
owner: root
type: bootstrap
version: 3.0
last_updated: 2026-07-13
depends_on: []
loads_when: ["*"]
status: active
confidence: stable
reviewed_on: 2026-07-13
review_frequency: quarterly
replaces: []
supersedes: []
tags: []
category: architecture
---
# AGENTS.md

This repository uses modular AI governance. `AGENTS.md` serves strictly as the bootstrap orchestrator for loading skills and must never duplicate the contents of individual skills.

## AI Bootstrap Sequence

At the start of every execution, the AI must follow this exact bootstrap sequence in order:

1. **Load `AGENTS.md`** — Initialize basic governance bootstrap.
2. **Load `governance/GOVERNANCE.md`** — Establish core policies, boundaries, and evidence standards.
3. **Load `workflow/AI_WORKFLOW.md`** — Establish the execution phases and gates.
4. **Load Project Context** — Load `.agents/project/PROJECT_CONTEXT.json` for repository constraints, and append an execution trace entry under phase tag "AGENTS-BOOTSTRAP" to `.agents/logs/DECISION_LOG.md` (detailing timestamp and files loaded).
5. **Perform Live Repository Discovery** — Run search tools to inspect the active branch state and codebase.
6. **Classify the Task** — Determine type (e.g., Feature, Fix, Audit, Refactor, Maintenance) and complexity.
7. **Discover Available Skills** — Scan the customization roots (e.g., `.agents/skills/*` or `skills.json`) for active expertise profiles.
8. **Resolve & Load Relevant Skills** — Dynamically resolve and load only the subset of skills matching the task classification. Never load unnecessary skills.
9. **Verify Ownership Boundaries** — Ensure no loaded skills have overlapping responsibilities or conflicting instructions.
10. **Continue with Implementation & Verification** — Execute the designated workflow phases.

## Modular Architecture Principle
This bootstrap document defines the orchestration of skill loading and general governance order. To preserve modular architecture, do not copy or move the rules, checklists, or specific logic of individual skills here. Individual skills are the sole, authoritative source of truth for their respective domains.

