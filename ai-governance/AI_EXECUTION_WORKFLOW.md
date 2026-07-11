# AI Execution Lifecycle

**Location:** `ai-governance/AI_EXECUTION_WORKFLOW.md`  
**Classification:** AI Runtime — Execution Engine  
**Registered in:** `ai-governance/AI_CONTEXT.json → primary.executionWorkflow`  
**Scope:** All AI developer tools operating in the Esparex repository.

---

## Purpose

This document is the runtime contract that every AI agent must execute — in order, without skipping — before, during, and after writing code in the Esparex repository.

Every phase declares its authority, inputs, process, outputs, and exit criteria. Every exit produces exactly one of three outcomes: **PASS**, **FAIL**, or **BLOCKED**. Execution is deterministic.

---

## Failure Policy

When any phase produces a **FAIL** outcome:

1. **Stop immediately.** Do not execute the next phase.
2. **Emit a failure report** containing:
   - Phase number and name
   - Gate identifier (if applicable)
   - Evidence collected
   - Reason for failure
   - Required remediation steps
3. **Do not attempt workarounds** — do not reorder phases, skip gates, or continue under assumption.
4. **Halt execution** and wait for explicit user resolution before resuming.

---

## Success Policy

When every phase in the lifecycle produces a **PASS** outcome:

1. **Execute Phase 18** — Completion Report.
2. **Return the implementation summary** as defined by the Completion Report template.
3. **End execution.**

---

## Phase Classification

Every phase in this lifecycle is one of two types:

| Type | Definition |
|------|-----------|
| **Execution Phase** | A mandatory step that produces an output required by subsequent phases. |
| **Execution Gate** | A mandatory validation checkpoint. Produces PASS, FAIL, or BLOCKED. Blocks continuation on failure. |

---

## Lifecycle Overview

```
Phase 0  — Context Loading           [Execution Phase]
Phase 1  — Request Analysis          [Execution Phase]
Phase 2  — Task Classification       [Execution Phase]

Phase 3  — Issue Validation          [Execution Gate]
Phase 4  — Pull Request Validation   [Execution Gate]
Phase 5  — Repository State Validation [Execution Gate]
Phase 6  — Branch Validation         [Execution Gate]

Phase 7  — Live Repository Discovery [Execution Phase]
Phase 8  — Skill Discovery           [Execution Phase]

Phase 9  — Duplicate & Reuse Audit  [Execution Gate]
Phase 10 — Architecture Validation  [Execution Gate]
Phase 11 — Pre-Implementation Quality Validation [Execution Gate]

Phase 12 — Implementation            [Execution Phase]

Phase 13 — Code Quality Validation  [Execution Gate]
Phase 14 — UI/UX Quality Validation [Execution Gate — Conditional]
Phase 15 — Repository Hygiene Validation [Execution Gate]
Phase 16 — Verification Pipeline    [Execution Gate]

Phase 17 — Pull Request Preparation [Execution Phase]
Phase 18 — Completion Report        [Execution Phase]
```

---

## Phase 0 — Context Loading

**Classification:** Execution Phase  
**Trigger:** Start of every task, before reading the user request.

### Authority
- `ai-governance/AI_CONTEXT.json`
- `.agents/AGENTS.md`

### Inputs
- Repository workspace
- Loaded AI tool context

### Process
1. Load `ai-governance/AI_CONTEXT.json` — identify all active SSOTs and the authoritative document hierarchy.
2. Load `ai-governance/AI_EXECUTION_WORKFLOW.md` (this document).
3. Load `.agents/AGENTS.md` — all active workspace behavioral rules.
4. Review the Knowledge Item (KI) system — check KI summaries for any artifacts relevant to the task before independent research.
5. Identify candidate Skills from the Skill Library — defer full load to Phase 8.

### Outputs
- Active SSOT map
- Workspace behavioral rules
- Candidate skill list

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | `AI_CONTEXT.json` loaded; SSOT paths confirmed; workspace rules loaded | Continue to Phase 1 |
| ❌ FAIL | `AI_CONTEXT.json` missing, corrupt, or unreadable | Stop. Emit failure report. |

---

## Phase 1 — Request Analysis

**Classification:** Execution Phase  
**Trigger:** After Phase 0 passes.

### Authority
- `.agents/AGENTS.md` — Rule 6 (Live Repository First)

### Inputs
- Complete user request text

### Process
1. Read the full user request before taking any action.
2. Extract **explicit requirements** — what is directly stated.
3. Extract **implicit requirements** — what is necessary but unstated.
4. List **assumptions** — any statement not directly verifiable from the request text. Every assumption must be verified against live source in Phase 7.
5. Identify **dependencies** — other systems, packages, or features this change touches.
6. Define **acceptance criteria** — specific, measurable outcomes that constitute task success.
7. Identify **risks and constraints** — scope boundaries, reversibility, impact surface.

### Outputs
- Requirement list (explicit + implicit)
- Assumption register
- Dependency map
- Acceptance criteria
- Risk register

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | Requirements understood; acceptance criteria defined; all assumptions documented | Continue to Phase 2 |
| ⚠️ BLOCKED | Request is ambiguous and clarification cannot be inferred from live repository | Request clarification. Halt. Do not implement under ambiguity. |

---

## Phase 2 — Task Classification

**Classification:** Execution Phase  
**Trigger:** After Phase 1 passes.

### Authority
- None. Classification is an internal routing decision.

### Inputs
- Requirement list from Phase 1
- Risk register from Phase 1

### Process
Assign one or more classification labels:

| Category | Examples |
|----------|----------|
| Feature | New business capability, new API endpoint |
| Bug Fix | Defect repair, regression fix |
| Refactoring | Restructuring without behavior change |
| UI/UX | Component, page, layout, accessibility change |
| Backend | Service, controller, middleware |
| Database | Schema, index, migration |
| DevOps | CI, deployment, build scripts |
| Security | Auth, permissions, secrets handling |
| Performance | Query optimization, caching, lazy loading |
| Architecture | Package structure, dependency changes |
| Repository Cleanup | Dead code, orphan files, unused dependencies |
| Testing | Unit, integration, E2E coverage |
| Documentation | Approved deliverable documents only |
| Governance | Standards, policy, workflow |

Also determine:

- **Scope**: Single file / Single package / Cross-package / Full-stack
- **Complexity**: Low / Medium / High
- **Risk**: Low (isolated) / Medium (shared module) / High (architectural or security impact)
- **UI Modified**: Yes / No — determines whether Phase 14 executes

### Outputs
- Task classification labels
- Scope, complexity, risk ratings
- UI-modified flag

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | Classification complete; scope, complexity, risk, and UI flag assigned | Continue to Phase 3 |

---

## Phase 3 — Issue Validation

**Classification:** Execution Gate  
**Trigger:** After Phase 2 passes.

### Authority
- `docs/governance/VERIFICATION_STANDARD.md §2` — verification gates

### Inputs
- Task description from Phase 1
- GitHub repository access

### Process
1. Search GitHub Issues for an existing Issue that tracks this work.
2. If a matching Issue exists → record the Issue number and title.
3. If no matching Issue exists → draft a complete Issue (title, description, acceptance criteria, labels) and stop until the Issue is created.

### Outputs
- GitHub Issue number
- Issue URL

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | A GitHub Issue exists and is linked to this task | Continue to Phase 4 |
| ❌ FAIL | No Issue exists | Draft the Issue. Stop. Halt until Issue is created and number confirmed. |

---

## Phase 4 — Pull Request Validation

**Classification:** Execution Gate  
**Trigger:** After Phase 3 passes.

### Authority
- `docs/governance/VERIFICATION_STANDARD.md §4` — Git workflow rules

### Inputs
- Task scope from Phase 2
- GitHub repository access

### Process
1. Inspect all open Pull Requests.
2. Search for PRs touching the same files, packages, or feature areas as this task.
3. If duplicate or overlapping work is found → record the PR number and stop.

### Outputs
- Confirmation of zero duplicate PRs
- Or: conflicting PR number for reporting

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | No open PR duplicates or overlaps found | Continue to Phase 5 |
| ❌ FAIL | An open PR covers the same scope | Stop. Report the conflicting PR. Do not duplicate in-progress work. |

---

## Phase 5 — Repository State Validation

**Classification:** Execution Gate  
**Trigger:** After Phase 4 passes.

### Authority
- `docs/governance/VERIFICATION_STANDARD.md §2` — sequential verification gates
- `docs/governance/VERIFICATION_STANDARD.md §5` — final checklist (`git status`)

### Inputs
- Live git repository state

### Process
Execute the following commands and evaluate output:

```
git status         # working tree must be clean
git log --oneline  # confirm no broken commit state
```

1. Verify the working tree is clean — no uncommitted changes unrelated to this task.
2. Verify no merge conflicts are present.
3. Verify no existing build failures on the current branch.

### Outputs
- Repository health status: Clean / Unclean / Conflicted

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | Working tree clean; no conflicts; no pre-existing build failures | Continue to Phase 6 |
| ❌ FAIL | Uncommitted unrelated changes, merge conflicts, or pre-existing build failures | Stop. Emit failure report listing specific issues. |

---

## Phase 6 — Branch Validation

**Classification:** Execution Gate  
**Trigger:** After Phase 5 passes.

### Authority
- `docs/governance/VERIFICATION_STANDARD.md §4` — branch protection rules

### Inputs
- Current branch name
- Git remote state

### Process
```
git branch         # confirm current branch name
git ls-remote      # confirm remote state
```

1. If the current branch has already been merged → verify merge completion, delete the stale branch, synchronize with the latest base branch, and create a new feature branch.
2. Verify branch naming follows project convention.
3. Verify the base branch is correct.
4. Confirm direct commits to `main` are not being attempted.

### Outputs
- Valid branch name
- Confirmed base branch

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | Branch is valid, correctly named, not merged, based on correct parent | Continue to Phase 7 |
| ❌ FAIL | Branch is stale/merged, misnamed, or targeting the wrong base | Remediate branch state. Do not continue on an invalid branch. |

---

## Phase 7 — Live Repository Discovery

**Classification:** Execution Phase  
**Trigger:** After Phase 6 passes.

### Authority
- `.agents/AGENTS.md` — Rule 6 (Live Repository First)
- `docs/governance/AI_GOVERNANCE_BOUNDARY.md §1.1` — canonical documents win; verify against live source

### Inputs
- Live source code files
- `package.json`, `tsconfig.json`, workspace configuration

> **Critical Rule:** Do not rely on documentation, Markdown files, comments, prior analysis reports, or previous conversation context as evidence of current repository state. Only live source code and live git output are authoritative.

### Process
Inspect the live repository directly. Map the following for the scope of this task:

| Category | Location |
|----------|----------|
| Folder structure | Root and package directories |
| Workspace configuration | Root `package.json`, workspace `package.json` files |
| React components | `apps/*/src/components/` |
| Custom hooks | `apps/*/src/hooks/` |
| Domain services | `core/src/services/` |
| REST route definitions | `backend/api/src/routes/` |
| Controllers | `backend/api/src/controllers/` |
| Middleware | `backend/api/src/middleware/` |
| Utilities | `core/src/utils/`, `shared/src/` |
| Validators & Zod schemas | `core/src/validators/` |
| TypeScript types & interfaces | `shared/src/types/` |
| Constants & enum records | `shared/src/constants/` |
| Mongoose models | `core/src/models/` |
| Test coverage | `*.test.ts`, `*.spec.ts` files adjacent to affected modules |

### Outputs
- Live repository map for the task scope
- Verified assumption register (all assumptions from Phase 1 resolved)

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | Live inspection complete for all relevant categories; all Phase 1 assumptions verified | Continue to Phase 8 |
| ❌ FAIL | Source files are inaccessible or assumption verification reveals a blocking contradiction | Stop. Emit failure report. |

---

## Phase 8 — Skill Discovery

**Classification:** Execution Phase  
**Trigger:** After Phase 7 passes.

### Authority
- Global Skill Library: `C:\Users\Administrator\.gemini\config\skills\`
- Workspace Skill Library: `.agents/skills/`

### Inputs
- Task classification from Phase 2
- Live repository map from Phase 7
- Candidate skill list from Phase 0

### Process
1. Identify which engineering skills are required for this task.
2. Check the Skill Library for a matching, existing Skill.
3. If a matching Skill exists → load it. Do not rebuild it.
4. If no matching Skill exists → create a reusable Skill, store it in the Skill Library at `.agents/skills/<skill-name>/SKILL.md`, then use it for this task.
5. Load **only** the Skills required for the current task.

### Outputs
- Loaded skill list
- Any newly created Skills registered in the Skill Library

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | Required skills identified; existing skills loaded; no redundant skill creation | Continue to Phase 9 |

---

## Phase 9 — Duplicate & Reuse Audit

**Classification:** Execution Gate  
**Trigger:** After Phase 8 passes.

### Authority
- `docs/governance/GOVERNANCE_POLICY.md §2.2` — DRY principle, Clean Architecture boundaries
- `docs/governance/REPOSITORY_GOVERNANCE_STANDARD.md §6` — package public interface specification

### Inputs
- Live repository map from Phase 7
- Task requirements from Phase 1

> **Critical Rule:** Always search before creating. Reuse existing implementations whenever possible. Extend existing files instead of creating new ones whenever practical.

### Process
Search the entire repository for each of the following before creating any new artifact:

| Artifact Type | Search Locations |
|---------------|-----------------|
| Hook | `apps/*/src/hooks/` |
| Component | `apps/*/src/components/` |
| Service method | `core/src/services/` |
| API endpoint | `backend/api/src/routes/` |
| Utility function | `core/src/utils/`, `shared/src/` |
| Validator / Zod schema | `core/src/validators/` |
| TypeScript type or interface | `shared/src/types/` |
| Constant or enum | `shared/src/constants/` |
| Middleware | `backend/api/src/middleware/` |
| Business logic | `core/src/services/` |

### Outputs
- Reuse map: for each required artifact, either an existing artifact to reuse/extend, or a justified reason for new creation

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | Zero unresolved duplicates; every required artifact either reused or justified | Continue to Phase 10 |
| ❌ FAIL | A duplicate artifact would be created without justification | Stop. Identify the existing artifact. Plan reuse or extension. |

---

## Phase 10 — Architecture Validation

**Classification:** Execution Gate  
**Trigger:** After Phase 9 passes.

### Authority
- `docs/governance/REPOSITORY_GOVERNANCE_STANDARD.md §1` — prohibited coding patterns
- `docs/governance/REPOSITORY_GOVERNANCE_STANDARD.md §2` — core architectural invariants
- `docs/governance/REPOSITORY_GOVERNANCE_STANDARD.md §6` — package public interface specification
- `docs/governance/REPOSITORY_GOVERNANCE_STANDARD.md §8` — package ownership matrix
- `docs/governance/GOVERNANCE_POLICY.md §2.2` — strict dependency flow and clean architecture boundaries

### Inputs
- Planned implementation from Phases 1 and 9
- Live repository map from Phase 7

### Process
Validate every planned change against the architectural invariants:

| Invariant | Check |
|-----------|-------|
| Downstream dependency direction preserved | Apps → API → Core → Shared. No upstream imports. |
| No circular dependencies | No package imports its own consumers. |
| Core is framework-independent | No Express or HTTP imports inside `core/src/`. |
| Controllers are thin | No database queries, no business logic inside `backend/api/src/controllers/`. |
| No direct model access from apps | `apps/*` must not import Mongoose models. |
| Services own transactions | No session or transaction management outside `core/src/services/`. |
| UI components are presentational | No direct API fetch calls inside React components. |
| Correct layer ownership | Change belongs to the right package per the ownership matrix. |
| Backward compatibility maintained | No breaking changes to any public interface without an ADR. |
| No new package without ADR | New workspace creation requires an approved Architecture Decision Record. |

### Outputs
- Architecture validation result: compliant or violation list

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | All architectural invariants confirmed unviolated | Continue to Phase 11 |
| ❌ FAIL | One or more invariants would be violated | Stop. Emit failure report listing each violation. Do not implement until the architectural plan is corrected. |

---

## Phase 11 — Pre-Implementation Quality Validation

**Classification:** Execution Gate  
**Trigger:** After Phase 10 passes.

### Authority
- `docs/governance/GOVERNANCE_POLICY.md §2.1` — naming conventions (camelCase, PascalCase, Boolean prefixes)
- `docs/governance/REPOSITORY_GOVERNANCE_STANDARD.md §7` — validator casing and categorization

### Inputs
- Planned file list
- Planned export list
- Naming decisions

### Process
Answer each question before creating any file:

| Question | Required Answer |
|----------|----------------|
| Can an existing file be extended instead of creating a new one? | Extend unless a new file is clearly justified |
| Is a new file actually necessary? | Document the justification |
| Does the proposed name conflict with an existing name? | Must not conflict |
| Would this introduce duplicate exports? | Must not introduce duplicates |
| Does naming follow conventions? | `camelCase` for scripts/variables; `PascalCase` for classes/components; `is`/`has`/`can` prefix for booleans |
| Does this violate layer ownership? | Must comply with the ownership matrix |
| Are shared utilities, hooks, types, or constants already available? | Use them |

### Outputs
- Finalized file list with justifications
- Confirmed naming decisions

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | Every new file justified; no naming conflicts; no duplicate exports; naming conventions confirmed | Continue to Phase 12 |
| ❌ FAIL | Unjustified new file, naming conflict, or convention violation | Stop. Resolve before implementation. |

---

## Phase 12 — Implementation

**Classification:** Execution Phase  
**Trigger:** After all gates in Phases 3–11 pass. Code may only be written after this phase begins.

### Authority
- `docs/governance/GOVERNANCE_POLICY.md §1` — TypeScript strict standards; no `any`; no speculative patches
- `docs/governance/GOVERNANCE_POLICY.md §2.2` — Clean Architecture boundaries; SOLID principles
- `docs/governance/DEVELOPER_HANDBOOK.md §4` — bottom-up feature implementation order

### Inputs
- Accepted requirement list from Phase 1
- Reuse map from Phase 9
- Finalized file list from Phase 11

### Process
Implement the change following the bottom-up dependency order:

1. **Contract types** — `shared/src/types/`
2. **DTO schemas** — `core/src/validators/`
3. **Database models** — `core/src/models/`
4. **Domain services** — `core/src/services/`
5. **Unit tests** — isolated Jest suites
6. **Controllers** — `backend/api/src/controllers/`
7. **Route bindings** — `backend/api/src/routes/`
8. **Integration tests** — Supertest
9. **OpenAPI specs** — Swagger configuration
10. **UI components** — `apps/*/src/components/` and pages

### Implementation Invariants

The following apply continuously throughout coding. Any violation is a blocking error:

| Invariant | Rule |
|-----------|------|
| No debug output | `console.log`, `console.debug`, `console.error` banned in committed code |
| No TODOs | `// TODO`, `// FIXME`, `// HACK` banned in committed code |
| No placeholder code | Every function must be fully implemented |
| No commented-out code | Deleted code must be deleted, not commented out |
| No hardcoded secrets | API keys, passwords, tokens, connection strings must use environment variables |
| No unused variables | Every declared variable must be consumed |
| No unused imports | Every import must be consumed |
| No unused exports | Every exported symbol must have at least one consumer |
| No dead code | Unreachable code paths must be removed |
| No partial implementations | Every feature must be complete when committed |
| No temporary files | No `_backup`, `_temp`, `_wip` files |

### Outputs
- Complete, committed implementation

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | Implementation complete; all invariants satisfied; no partial work | Continue to Phase 13 |
| ❌ FAIL | Any invariant violated or implementation incomplete | Fix all violations before proceeding. |

---

## Phase 13 — Code Quality Validation

**Classification:** Execution Gate  
**Trigger:** After Phase 12 passes.

### Authority
- `docs/governance/GOVERNANCE_POLICY.md §1` — type safety and ESLint rules
- `docs/governance/GOVERNANCE_POLICY.md §2.2` — separation of concerns, high cohesion, low coupling

### Inputs
- Completed implementation from Phase 12

### Process

| Check | Standard |
|-------|----------|
| **File size and focus** | A file serving more than one clear concern must be split |
| **Function focus** | Every function does exactly one thing |
| **Import hygiene** | Sorted (external → internal → relative); no unused; no duplicate imports |
| **Lazy loading** | Dynamic imports applied where full module loading at startup is not required |
| **Render efficiency** | No unnecessary re-renders from unstable references, missing memoization, or incorrect dependency arrays |
| **API deduplication** | No duplicate API requests for the same data within one user interaction |
| **Coupling** | No new tight coupling between layers that previously had none |

### Outputs
- Code quality validation result

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | All checks pass; no mixed-concern files; import hygiene confirmed | Continue to Phase 14 |
| ❌ FAIL | Any check fails | Fix and re-validate from Phase 13. |

---

## Phase 14 — UI/UX Quality Validation

**Classification:** Execution Gate — Conditional  
**Trigger:** After Phase 13 passes. Execute **only** if the UI-modified flag from Phase 2 is `Yes`. Otherwise skip directly to Phase 15.

### Authority
- `docs/governance/GOVERNANCE_POLICY.md §2.2` — frontend purity (presentational components only)

### Inputs
- All modified or created UI components and pages

### Process

**Responsive Layout**

| Check | Standard |
|-------|----------|
| Mobile-first layout | Smallest breakpoint is the design baseline |
| Tablet breakpoint | Layout adapts correctly |
| Desktop breakpoint | Layout adapts correctly |
| No horizontal scrolling | No overflow introduced at any breakpoint |

**Accessibility**

| Check | Standard |
|-------|----------|
| Keyboard navigation | All interactive elements reachable and operable via keyboard |
| Semantic HTML | Correct heading hierarchy; appropriate semantic elements |
| ARIA attributes | Correct and non-redundant |
| Focus management | Modals trap focus; dialogs restore focus on close |
| Color contrast | WCAG AA minimum met |

**UI States**

Every interactive element must implement all applicable states:

| State | Requirement |
|-------|-------------|
| Loading | Shown while async operations are in progress |
| Empty | Shown when a list or resource has no items |
| Error | Shown when an operation fails; message is actionable |
| Success | Confirmed when an operation completes |
| Validation | Inline, real-time, field-level feedback |

**Functional Completeness**

| Element | Requirement |
|---------|-------------|
| Button | Has a defined, fully implemented action |
| Link | Navigates to a valid, implemented route |
| Navigation item | Points to a reachable destination |
| Form | Submits to a real API endpoint |
| Modal / Dialog | Opens, submits, and closes correctly |
| Dropdown / Filter / Search / Pagination | Fully functional |
| No placeholder actions | `onClick={() => {}}` is banned |
| No dead buttons | Every button does something |
| No broken links | Every link goes somewhere |
| No orphan UI | No component rendered but disconnected from state or data |

### Outputs
- UI/UX validation result

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | All responsive, accessibility, state, and completeness checks pass | Continue to Phase 15 |
| ❌ FAIL | Any check fails | Fix and re-validate from Phase 14. |
| ➡️ SKIP | UI-modified flag is `No` | Skip to Phase 15. |

---

## Phase 15 — Repository Hygiene Validation

**Classification:** Execution Gate  
**Trigger:** After Phase 14 passes or is skipped.

### Authority
- `docs/governance/GOVERNANCE_POLICY.md §3.2` — document lifecycle; no suffix proliferation; update in place

### Inputs
- Full working tree state

### Process
Verify the working tree contains **only** files that belong to this implementation:

| Category | Rule |
|----------|------|
| Temporary files | Must not exist (`*.tmp`, `*.temp`, `*.bak`) |
| Debug files | Must not exist (`debug.*`, `test-output.*`) |
| Scratch files | Must not exist (any file prefixed `scratch-`, `_temp`, `_wip`) |
| Backup files | Must not exist (`*.orig`, `*_backup.*`, `* copy.*`) |
| Generated artifacts | Build outputs (`dist/`, `.next/`, `*.tsbuildinfo`) must not be staged |
| Orphan files | Files no longer imported or referenced must be removed |
| Unused assets | Images, fonts, icons with no source references must be removed |
| Unused styles | CSS/SCSS blocks with zero consumers must be removed |
| Unnecessary Markdown | Temporary `.md` files created during analysis must be deleted |
| Duplicate documentation | Any doc that duplicates an existing canonical SSOT must be removed |

### Outputs
- Repository hygiene status: Clean / Violations found

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | Working tree contains only intended files; no temporary, orphan, or duplicate artifacts | Continue to Phase 16 |
| ❌ FAIL | Any disallowed files found | Remove them. Re-validate from Phase 15. |

---

## Phase 16 — Verification Pipeline

**Classification:** Execution Gate  
**Trigger:** After Phase 15 passes.

### Authority
- `docs/governance/VERIFICATION_STANDARD.md §2` — sequential verification gates
- `docs/governance/AI_GOVERNANCE_BOUNDARY.md §4` — required pre-PR commands

### Inputs
- Complete, clean implementation from all prior phases

### Process
Execute in this exact order. If any step fails, fix the issue and re-run **all steps from step 1**:

```
1.  npm run format
    Code formatting (Prettier)

2.  npm run lint
    ESLint — type safety, unused imports, boundary violations

3.  npm run type-check
    TypeScript strict compilation

4.  npm run test:unit
    Jest — isolated core service tests

5.  npm run test:integration
    Jest + Supertest — REST API shape tests

6.  npm run build
    Full monorepo production build

7.  npm run guard:platform-governance
    Architecture boundary validation

8.  npm run docs:lint
    Document hygiene check

9.  npm run repository:doctor -- --profile ci
    Repository health check
```

If the UI-modified flag is `Yes`, also run:
```
10. npm run test:e2e
    Playwright E2E — user-facing flow validation
```

### Outputs
- Verification pipeline output (pass/fail per step)

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | All applicable steps complete with zero errors; no `eslint-disable` suppressions without justification; no `as` or `!` type assertions without structural justification | Continue to Phase 17 |
| ❌ FAIL | Any step fails | Fix the failure. Re-run all steps from step 1. |

---

## Phase 17 — Pull Request Preparation

**Classification:** Execution Phase  
**Trigger:** After Phase 16 passes.

### Authority
- `docs/governance/REPOSITORY_GOVERNANCE_STANDARD.md §10` — pull request architecture checklist
- `docs/governance/VERIFICATION_STANDARD.md §4` — Git workflow rules
- `commitlint.config.js` — conventional commit format enforcement

### Inputs
- Passing verification pipeline from Phase 16
- GitHub Issue number from Phase 3

### Process

**Commit Standards**

Every commit must follow Conventional Commits as enforced by `commitlint.config.js`:

```
<type>(<scope>): <description>

Types:  feat | fix | refactor | perf | test | docs | build | ci | chore
Scope:  package or feature area (e.g., core, backend-api, apps-web)
Description: imperative present tense; lowercase; no trailing period
```

**Pull Request Requirements**

| Field | Requirement |
|-------|-------------|
| Title | Conventional commit format: `type(scope): description` |
| Issue reference | `Closes #<issue-number>` |
| Description | What changed and why — not a repetition of the commit log |
| Testing evidence | Paste Phase 16 verification pipeline output |
| Rollback strategy | Steps to revert if the change causes a regression |
| Known risks | Limitations, edge cases, deferred work |
| Architecture checklist | Complete `REPOSITORY_GOVERNANCE_STANDARD.md §10` checklist |

**Never:**
- Merge automatically
- Self-approve
- Bypass the CI pipeline

### Outputs
- Published Pull Request with all required fields completed

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | All commits are conventional; PR published with all fields; architecture checklist complete | Continue to Phase 18 |
| ❌ FAIL | Commit format violations or required PR fields missing | Fix and re-publish. |

---

## Phase 18 — Completion Report

**Classification:** Execution Phase  
**Trigger:** After Phase 17 passes.

### Authority
- `docs/governance/VERIFICATION_STANDARD.md §5` — final completion checklist

### Inputs
- Gate outputs from all prior phases

### Process
Complete the following report. Every field must be populated with objective evidence — not assumed states.

```
## Completion Report

### Issue Reference
GitHub Issue: #<number> — <title>

### Branch
`<feature-branch-name>` → targeting `<base-branch>`

### Skills Used
<skill-name>: <how it was used>

### Files Modified
`<path>` — <one-line description>

### Files Created
`<path>` — <one-line description of purpose>

### Files Deleted
`<path>` — <reason for deletion>

### Gate Summary
| Phase | Gate | Outcome | Evidence |
|-------|------|---------|----------|
| Phase 3  | Issue Validation          | ✅ PASS | Issue #<n> confirmed |
| Phase 4  | Pull Request Validation   | ✅ PASS | No duplicate PRs found |
| Phase 5  | Repository State Validation | ✅ PASS | git status: clean |
| Phase 6  | Branch Validation         | ✅ PASS | Branch: <name>; base: <base> |
| Phase 9  | Duplicate & Reuse Audit  | ✅ PASS | Reuse map confirmed |
| Phase 10 | Architecture Validation  | ✅ PASS | All invariants satisfied |
| Phase 11 | Pre-Implementation Quality Validation | ✅ PASS | |
| Phase 13 | Code Quality Validation  | ✅ PASS | |
| Phase 14 | UI/UX Quality Validation | ✅ PASS / ➡️ SKIP | |
| Phase 15 | Repository Hygiene Validation | ✅ PASS | |
| Phase 16 | Verification Pipeline    | ✅ PASS | All steps passed |

### Architecture Impact
<Change description, or: "None — isolated to <package>.">

### Security Status
<No new vulnerabilities introduced, or: list findings.>

### Remaining Technical Debt
<Known limitations or deferred items, or: "None.">

### Follow-Up Recommendations
<Optional next steps or improvements identified during implementation.>
```

### Final Completion Checklist

Task status is **Completed** only when every item below is satisfied.  
If any item is missing or unverified, status remains **In Progress**.

- [ ] Working tree is clean — `git status` output confirms
- [ ] All commits present locally — `git log` output confirms
- [ ] Branch exists on remote — `git ls-remote` output confirms
- [ ] CI pipeline passed on remote repository
- [ ] No temporary artifacts remain in the working tree
- [ ] Documentation matches the actual repository state
- [ ] Completion Report populated with objective evidence for every field

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | Every checklist item satisfied; Completion Report fully populated with evidence | **Execution complete. Return Completion Report.** |
| ❌ FAIL | Any checklist item unverified | Do not declare completion. Resolve the missing item. |
