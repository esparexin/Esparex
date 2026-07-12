---
id: global-governance
owner: governance
type: governance
version: 2.0
last_updated: 2026-07-12
depends_on: []
loads_when: ["*"]
---
# Agent Rules & Constraints

**Version:** 2.0
**Last Updated:** 2026-07-12
**Compatible Workflow Version:** 2.0
**Status:** Active

---

## 1. Core Policies

Every developer AI agent executing in this workspace must load and obey these canonical governance policies as the single source of truth. These are non-negotiable architectural boundaries.

1. **Live Repository First**:
   - Never rely on documentation, Markdown files, comments, or prior analysis as evidence of current repository state.
   - All implementation decisions require direct inspection of the live source code and current git state.

2. **Verification & Evidence Rules**:
   - Refer strictly to the evidence standards and checklists.
   - Never report a task as complete without verified, objective evidence.

3. **AI Prompts & Isolation boundaries**:
   - Obey the prompt isolation boundaries and non-authoritative status rules.

4. **Engineering conventions & type safety**:
   - Adhere to casing, type-safety, and TypeScript constraints.

5. **Architectural boundaries**:
   - Follow import boundary invariants and package public interfaces.

## 2. Repository Discipline

1. **Reuse before creating**: 
   - Never create duplicate collections, schemas, models, indexes, or migrations.
2. **Extend before duplicating**.
3. **Refactor before replacing**.
4. **Remove dead code before adding new code**.
5. **No file creation without necessity**:
   - Prefer modifying existing files over creating new ones. Every new file increases long-term maintenance cost.
   - Keep the repository clean and follow the existing architecture.

## 3. Documentation Minimalism

1. Do not create `.md` files unless they provide long-term, ongoing operational value.
2. **Do not create Markdown files for audits, reports, validation, implementation summaries, progress tracking, or temporary planning.**
3. Reuse existing documentation whenever possible instead of creating new files.
4. Avoid documentation duplication.

## 4. Knowledge Creation Rule

Do not create a new Rule, Skill, Verification module, or Template unless:
1. The knowledge is reusable.
2. It cannot logically belong in an existing module.
3. It contains sufficient implementation detail to provide ongoing value.
4. It is expected to be reused across multiple tasks.
