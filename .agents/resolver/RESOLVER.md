---
id: context-resolver
owner: resolver
type: resolver
version: 1.0
last_updated: 2026-07-12
depends_on: []
loads_when: ["*"]
---
# The Resolver

This module determines exactly what engineering knowledge to load for a given task. It is the only phase allowed to dictate context injection.

## Responsibility
The Resolver maps the user's intent to specific rules, skills, and verification modules. It prevents context bloat by ensuring that the AI never loads knowledge irrelevant to the current task.

## Inputs
Before resolution begins, the AI must collect:
1. **Task**: The user's explicit request.
2. **Repository Discovery**: The results of inspecting the live codebase to determine the actual stack in use.
3. **Project Context**: Relevant business boundaries.
4. **Change Type**: Categorization of the change (e.g., UI, Database, API, CI, Security).

## Outputs
Using the inputs and the mappings defined in `RESOLVER.json`, the Resolver dictates:
- **Required Skills**: e.g., `react`, `ui-audit`
- **Required Rules**: e.g., `rules/ui/accessibility`
- **Required Verification**: e.g., `verification/ui`, `verification/code`
- **Priority**: e.g., High, Medium, Low

## Execution
The AI must cross-reference the change type with the `RESOLVER.json` map and load *only* the returned modules before proceeding to the Planning phase.
