---
id: ai-execution-workflow
owner: workflow
type: workflow
version: 2.0
last_updated: 2026-07-12
depends_on: ["global-governance", "resolver"]
loads_when: ["*"]
status: active
confidence: stable
reviewed_on: 2026-07-12
review_frequency: quarterly
replaces: []
supersedes: []
tags: []
category: architecture
---
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

Phase 3  — Issue Validation              [Execution Gate]
Phase 4  — Conflict Detection            [Execution Gate]
Phase 5  — Repository State Validation   [Execution Gate]
Phase 6  — Branch & Draft PR Creation    [Execution Gate]

Phase 7  — Live Repository Discovery     [Execution Phase]
Phase 8  — Policy Engine                 [Execution Phase]
Phase 8.5 — Impact Analysis              [Execution Phase]

Phase 9  — Duplicate & Reuse Audit       [Execution Gate]
Phase 10 — Architecture Validation       [Execution Gate]
Phase 11 — Pre-Implementation Quality Validation [Execution Gate]

⛔ NO CODE MAY BE WRITTEN UNTIL PHASES 3–11 ALL PASS

Phase 12 — Implementation                [Execution Phase]

Phase 13 — Code Quality Validation       [Execution Gate]
Phase 14 — UI/UX Quality Validation      [Execution Gate — Conditional]
Phase 15 — Repository Hygiene Validation [Execution Gate]
Phase 16 — Verification Pipeline         [Execution Gate]

Phase 17 — PR Finalization               [Execution Phase]
Phase 18 — Completion Report             [Execution Phase]
```

---

## Phase 0 — Context Loading

**Classification:** Execution Phase  
**Trigger:** Start of every task, before reading the user request.

### Inputs
- Repository workspace
- Loaded AI tool context

### Process
1. Load `.agents/AGENTS.md` — The bootstrap file that defines the execution entry point.
2. Load `.agents/governance/GOVERNANCE.md` — The non-negotiable architectural boundaries.
3. Load `.agents/workflow/AI_WORKFLOW.md` (this document) — The execution process.
4. Load `.agents/project/PROJECT_CONTEXT.json` — The business rules and project data.

### Outputs
- Active SSOT map
- Workspace behavioral rules
- Core context loaded

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | Core bootstrap files and governance policies loaded | Continue to Phase 1 |
| ❌ FAIL | Any core bootstrap file missing, corrupt, or unreadable | Stop. Emit failure report. |

---

## Phase 1 — Request Analysis

**Classification:** Execution Phase  
**Trigger:** After Phase 0 passes.

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

## Phase 4 — Conflict Detection

**Classification:** Execution Gate  
**Trigger:** After Phase 3 passes.

> **Renamed from "Pull Request Validation"** to remove ambiguity. This phase detects conflicts in open PRs — it does NOT satisfy any PR creation obligation. A PR is created in Phase 6.

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

## Phase 6 — Branch & Draft PR Creation

**Classification:** Execution Gate  
**Trigger:** After Phase 5 passes.

> **Expanded from "Branch Validation"**. This gate now requires a feature branch AND a draft PR to exist before execution continues. Implementation is blocked until both are confirmed.

### Inputs
- Current branch name
- Git remote state
- GitHub Issue number from Phase 3

### Process

**Step 1 — Verify or create a feature branch:**
```
git branch         # confirm NOT on main or develop
git ls-remote      # confirm remote state
```

1. If currently on `main` or `develop` → create a feature branch immediately:
   ```
   git checkout -b feat/issue-{N}-{short-description}
   ```
2. If a stale/merged branch exists → delete it, sync with base, and create a new feature branch.
3. Branch name must follow convention: `feat/issue-{N}-{description}`, `fix/issue-{N}-{description}`, `refactor/issue-{N}-{description}`, etc.
4. Push the branch to remote immediately:
   ```
   git push -u origin {branch-name}
   ```

**Step 2 — Open a Draft Pull Request:**

5. Open a **draft** Pull Request on GitHub:
   - Base: `main`
   - Head: the feature branch created in Step 1
   - Title: follows Conventional Commits format
   - Body: includes `Closes #{issue-number}` from Phase 3
6. Record the draft PR URL as evidence.

> ⛔ **IMPLEMENTATION BLOCKER**: If either the feature branch or the draft PR does not exist, do NOT proceed to Phase 7. Halt until both are confirmed.

### Outputs
- Valid feature branch name (not `main` or `develop`)
- Confirmed branch exists on remote (`git ls-remote` output)
- Draft PR URL (GitHub)

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | Feature branch exists on remote AND draft PR is open and linked to the Issue | Continue to Phase 7 |
| ❌ FAIL | Currently on `main`/`develop`, or no feature branch exists on remote, or no draft PR open | Create branch. Push. Open draft PR. Do not continue until all three are confirmed. |

---

## Phase 7 — Live Repository Discovery

**Classification:** Execution Phase  
**Trigger:** After Phase 6 passes.

### Inputs
- Live source code files
- `package.json`, `tsconfig.json`, workspace configuration

> **Critical Rule:** Do not rely on documentation, Markdown files, comments, prior analysis reports, or previous conversation context as evidence of current repository state. Only live source code and live git output are authoritative.

### Process
Inspect the live repository directly. You must explicitly answer these 6 questions before proceeding:
1. **What exists?** (Current implementations)
2. **Where is SSOT?** (Single Source of Truth)
3. **What depends on it?** (Downstream consumers)
4. **Can it be reused?** (Duplicate prevention)
5. **What will break?** (Risk surface)
6. **Is there already an Issue?** (Tracking)

Map the following for the scope of this task:

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

## Phase 8 — Policy Engine

**Classification:** Execution Phase  
**Trigger:** After Phase 7 passes.

### Inputs
- Task classification from Phase 2
- Live repository map from Phase 7
- Project Context from Phase 0

### Process
1. Access the Policy Engine framework at `.agents/policy_engine/POLICY_ENGINE.json`.
2. Map the task's Change Type, the Repository Discovery, and Project Context through the Policy Engine.
3. Load exactly the output dependencies dictated by the Policy Engine:
   - **Required Skills** (from `.agents/skills/`)
   - **Required Rules** (from `.agents/rules/`)
   - **Required Verification** (from `.agents/verification/`)
   - **Priority**
4. Do not load any rule, skill, or verification module that the Policy Engine does not explicitly demand.

### Outputs
- Dynamically loaded context containing only task-relevant expertise and validation gates.

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | Policy Engine executed and specific rules/skills/verification loaded | Continue to Phase 8.5 |

---

## Phase 8.5 — Impact Analysis

**Classification:** Execution Phase  
**Trigger:** After Phase 8 passes.

### Inputs
- Loaded rules, skills, and verifications from Phase 8
- Discovery mapping from Phase 7

### Process
Before writing any code, explicitly analyze the cross-boundary impact of the planned change. 
1. **API Impact:** Will this require frontend client updates?
2. **Database Impact:** Will this require migrations or index changes?
3. **Frontend Impact:** Will this break existing UI state management?
4. **Admin Impact:** Does the admin portal need to be aware of this state?
5. **Testing Impact:** Which test suites will break?

### Outputs
- Documented Impact Surface Map (Internal memory only, unless requested by user)

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | Impact surface mapped across all domains | Continue to Phase 9 |
---

## Phase 9 — Duplicate & Reuse Audit

**Classification:** Execution Gate  
**Trigger:** After Phase 8 passes.

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

### Inputs
- Planned implementation from Phases 1 and 9
- Validation checklists loaded by the Resolver (e.g., `.agents/verification/pre_implementation.md`)

### Process
1. Execute the `pre_implementation.md` checklist from the verification modules.
2. Ensure every step (e.g., draft PR open, branch exists on remote, reused existing implementations) is strictly followed.
3. Apply any domain-specific rules loaded by the Resolver (e.g., security checks, API conventions, database rules).

### Outputs
- Completed Pre-Implementation Verification checklist

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | Verification checklist complete; all gates passed | Continue to Phase 12 |
| ❌ FAIL | Any checklist item missing or incomplete | Stop. Resolve before implementation. |

---

## Phase 12 — Implementation

**Classification:** Execution Phase  
**Trigger:** After all gates in Phases 3–11 pass. Code may only be written after this phase begins.

> ⛔ **MANDATORY PREREQUISITE CHECK** — Before writing a single line of code, verify:
> 1. You are on a **feature branch** (NOT `main` or `develop`) — confirmed by `git branch`.
> 2. That feature branch **exists on remote** — confirmed by `git ls-remote`.
> 3. A **draft Pull Request is open** on GitHub, linked to the Issue from Phase 3.
>
> If any of the three conditions above is not met, **STOP**. Return to Phase 6 and resolve before continuing.

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

### Inputs
- Full working tree state
- `.agents/verification/repository_cleanup.md`

### Process
1. Execute the `repository_cleanup.md` checklist.
2. Verify no temporary files (`*.tmp`, `*.bak`, `_wip`, `scratch-`), debug outputs, or orphan files remain in the working tree.
3. If new documentation is created, apply `.agents/verification/documentation_gate.md` to ensure it is not duplicative and provides long-term value.

### Outputs
- Repository hygiene status: Clean / Violations found

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | Working tree contains only intended files; all checklists pass | Continue to Phase 16 |
| ❌ FAIL | Any disallowed files found | Remove them. Re-validate from Phase 15. |

---

## Phase 16 — Verification Pipeline

**Classification:** Execution Gate  
**Trigger:** After Phase 15 passes.

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

8.  npm run repository:doctor -- --profile ci
    Repository health check
```

If the UI-modified flag is `Yes`, also run:
```
9. npm run test:e2e
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

## Phase 17 — PR Finalization

**Classification:** Execution Phase  
**Trigger:** After Phase 16 passes.

> **Renamed from "Pull Request Preparation"**. The draft PR was opened in Phase 6. This phase finalizes it: marks it ready for review, attaches verification evidence, and confirms CI passes on remote.

### Inputs
- Draft PR URL from Phase 6
- Passing verification pipeline from Phase 16
- GitHub Issue number from Phase 3

### Process

**Step 1 — Verify all commits are conventional:**

Every commit must follow Conventional Commits as enforced by `commitlint.config.js`:

```
<type>(<scope>): <description>

Types:  feat | fix | refactor | perf | test | docs | build | ci | chore
Scope:  package or feature area (e.g., core, backend-api, apps-web)
Description: imperative present tense; lowercase; no trailing period
Body lines: max 100 characters each
```

**Step 2 — Complete the PR body:**

| Field | Requirement |
|-------|-------------|
| Title | Conventional commit format: `type(scope): description` |
| Issue reference | `Closes #<issue-number>` |
| Description | What changed and why — not a repetition of the commit log |
| Testing evidence | Paste Phase 16 verification pipeline output |
| Rollback strategy | Steps to revert if the change causes a regression |
| Known risks | Limitations, edge cases, deferred work |
| Architecture checklist | Complete `REPOSITORY_GOVERNANCE_STANDARD.md §10` checklist |

**Step 3 — Mark PR ready for review:**
- Convert the draft PR to "Ready for review" status.
- Confirm CI pipeline is triggered and passes on remote.

**Never:**
- Merge automatically
- Self-approve
- Bypass the CI pipeline

### Outputs
- PR URL (confirmed, not a local artifact)
- PR status: Ready for Review (no longer draft)
- CI pipeline passing on remote

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | All commits conventional; PR marked ready; all fields complete; CI passing on remote | Continue to Phase 18 |
| ❌ FAIL | Commit format violations, missing PR fields, or CI failing on remote | Fix and re-validate. |

---

## Phase 18 — Response Formatter

**Classification:** Execution Phase  
**Trigger:** After Phase 17 passes.

### Inputs
- Gate outputs from all prior phases

### Process
Output a deterministic, machine-readable summary. Avoid verbose paragraphs.

```
✓ Discovery Complete
✓ Existing implementation reused
✓ Duplicate logic not introduced
✓ Verification Passed

Changed
- <File 1>
- <File 2>

Checks
✓ Typecheck
✓ Build
✓ Repository Rules
✓ UI/UX Validation (if applicable)

Next
<Concise prompt for next action>
```

### Final Completion Checklist

Task status is **Completed** only when every item below is satisfied.  
If any item is missing or unverified, status remains **In Progress**.

- [ ] Working tree is clean — `git status` output confirms
- [ ] All commits present locally — `git log` output confirms
- [ ] Feature branch was used (NOT `main`) — `git log --oneline` confirms
- [ ] Branch exists on remote — `git ls-remote` output confirms
- [ ] **Pull Request URL confirmed** — not a walkthrough artifact, a real GitHub PR link
- [ ] PR is linked to the GitHub Issue (`Closes #N` in body)
- [ ] CI pipeline passed on remote repository — link to CI run
- [ ] PR has not been self-approved or auto-merged
- [ ] No temporary artifacts remain in the working tree
- [ ] Documentation matches the actual repository state
- [ ] Completion Report populated with objective evidence for every field

### Exit Criteria

| Outcome | Condition | Next Action |
|---------|-----------|-------------|
| ✅ PASS | Every checklist item satisfied; Response Formatter output provided | **Execution complete.** |
| ❌ FAIL | Any checklist item unverified | Do not declare completion. Resolve the missing item. |

