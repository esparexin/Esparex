# AI Change SOP

Status: Active  
Effective Date: 2026-04-14  
Scope: All AI-assisted code and documentation changes in this repository

## Purpose

This file is the standard operating procedure for AI agents working in Esparex.

It operationalizes the AI governance SSOT and the platform governance docs into a single execution workflow.

## 1. Required Workflow

For every AI-generated change, follow this order:

1. Read the task and classify the affected layer: docs, shared, backend, frontend, admin, infrastructure, or runtime AI.
2. Read `ai-governance/SSOT.md`.
3. Identify the canonical owner module in the active workspace code or guard scripts.
4. If modifying documentation, check `docs/00-index.md` for the canonical file and update it in place.
5. Search for an existing implementation before creating a new file, folder, hook, service, schema, component, or prompt.
5. Prefer extending the canonical owner over creating a parallel module.
6. If behavior, contracts, lifecycle, naming, or architecture changes, update the governing documentation in the same change when safe.
7. Run the relevant checks before marking the task complete.

Default bias:

- extend before creating
- reuse before duplicating
- keep the diff small
- stop before speculative refactors

## 2. File and Folder Creation Rules

Create a new file only when one of these is true:

- the responsibility is clearly new and bounded
- the logic is shared by multiple callers
- the existing file would violate separation of concerns if expanded further
- the change is part of an approved migration or refactor plan

Do not create a new file or folder when:

- an existing canonical module can absorb the change cleanly
- the new file would be a duplicate variant of an existing concept
- the folder would create a second home for the same domain
- the document would duplicate information already in `docs/` or `ai-governance/`

## 2. Reference Governance

Before implementing any change, AI agents MUST consult the following canonical sources:

1. **Registry**: `docs/00-index.md` (To identify the correct doc to update).
2. **Matrix**: `docs/07-enforcement-matrix.md` (To identify the correct guard to run).
3. **SSOT**: `ai-governance/SSOT.md` (For platform-wide AI behavior rules).

## 3. Delete and Cleanup Rules

Before deleting a file:

- search for active imports and references
- confirm the file is dead, replaced, or deprecated by the current change
- remove dependent imports, exports, and tests in the same change when applicable

Delete code when:

- the file has zero active imports or references
- responsibility moved to the canonical owner
- the file is an exact duplicate caused by drift

Do not delete when:

- the file is part of a staged migration
- the file is ignored local tool state on the user’s machine and not safely reproducible
- the file may still be needed by a local IDE workflow and no replacement has been documented

## 5. Tool-Specific File Policy

Tool-specific files outside `ai-governance/` are compatibility surfaces only.

Examples:

- `.antigravity.system.prompt.md`
- `.cursorrules`
- `frontend/.cursorrules`
- `.claude/settings.local.json`
- `.kilo/`
- `.kombai/`
- `.config/.commands/`
- `.config/.agent/`

Rules for these surfaces:

- do not treat them as SSOT
- do not add new governance logic to them
- if a local tool requires them, keep them as thin wrappers or generated mirrors of `ai-governance/`
- if they are ignored local files, do not delete them blindly in a repo change

## 6. Multi-AI Coordination

When multiple AI tools are used on the same repo:

- one task or PR addresses one problem category only
- one AI agent owns a given write scope at a time
- `shared/`, root config, and contract files are serialized work areas
- do not overwrite or revert another agent’s work without understanding it
- merge shared-contract changes before dependent frontend or backend changes

## 7. Verification and Done Criteria

No AI change is complete until verification has been attempted and reported.

Minimum expectations:

- run the relevant build, typecheck, lint, or test commands for touched workspaces
- run documented repo guard commands when applicable
- if checks were not run, state that explicitly

Every final summary must include:

- files changed
- checks run
- blockers or unresolved risks

## 8. Stop-and-Ask Conditions

Stop and request a human decision when:

- the change alters business logic that was not requested
- the change alters an API contract without approval
- the change requires a new competing architecture pattern
- two canonical documents conflict in a way that changes behavior
- the change would delete local ignored tool files without a safe migration path
