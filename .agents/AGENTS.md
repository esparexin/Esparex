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


## Graphify Verification

Before implementation:

? Confirm Graphify MCP is connected.

? Confirm Graphify Skill is loaded.

? Use Graphify to discover:
  - impacted files
  - dependency paths
  - repository ports
  - composition roots
  - cross-domain dependencies

If Graphify is unavailable, report that explicitly and fall back to repository analysis.

## Documentation Ownership & Single Source of Truth

Before creating, modifying, or suggesting documentation, determine which document owns the information.

### AGENTS.md (AI Operating Manual)

Owner:
- AI behavior
- Repository execution rules
- Git workflow rules
- Graphify usage
- Verification requirements
- Coding rules
- Repository constraints
- Commit rules
- Documentation rules
- AI operating instructions

Rule:
If the information changes how the AI thinks, analyzes, plans, implements, verifies, commits, or interacts with the repository, it belongs ONLY in AGENTS.md.

---

### GOVERNANCE.md (Architecture Standard)

Owner:
- DDD
- Hexagonal Architecture
- Ports & Adapters
- Bounded Contexts
- Dependency Rules
- Naming Conventions
- Repository Architecture Standards

Rule:
Never place AI execution rules or workflow instructions here.

---

### AI_WORKFLOW.md (Execution Lifecycle)

Owner:
- AI execution phases
- Workflow gates
- Phase transitions
- Execution sequence

Example:
Discovery
→ Analysis
→ Planning
→ Implementation
→ Verification
→ Completion

Rule:
Never place repository policies, Git rules, coding standards, or architecture standards here.

---

### README.md (Human Documentation)

Owner:
- Project overview
- Installation
- Setup
- Build
- Run
- Development guide
- Environment setup

Rule:
Never place AI instructions or internal repository governance here.

---

## Mandatory Decision Before Adding Any Rule

Before adding any rule or instruction, determine its owner.

Ask:

1. Does this change AI behavior?
→ AGENTS.md

2. Does this define software architecture?
→ GOVERNANCE.md

3. Does this change the execution lifecycle?
→ AI_WORKFLOW.md

4. Is this for developers using the project?
→ README.md

If none apply, do not create a new document.

---

## Prevent Documentation Drift

- Every rule has exactly one owner.
- Never duplicate rules across multiple documents.
- Reference the owner document instead of copying content.
- Do not create new .md files unless explicitly requested.

---

## Repository Rule

When the user introduces a new rule, instruction, workflow, or policy, first determine which document owns it.

If the correct owner is unclear, ask:

"Should this become a permanent repository rule? If yes, I'll add it to the appropriate owner document."

---

## Mandatory Workflow Enforcement

**This instruction applies to every task, every prompt, without exception.**

The guidelines defined in `workflow/AI_WORKFLOW.md` must be followed throughout the entire task lifecycle — in phase order, with no phases skipped.

### Non-Negotiable Phase Requirements

**Phase 3 — Issue Validation (HARD GATE)**
- Search GitHub Issues for an existing Issue before any branch, code, or PR is created.
- If no matching Issue exists: draft the Issue title, description, acceptance criteria, and labels — then **STOP**. Do not proceed until the Issue number is confirmed.
- No code may be written before a GitHub Issue number is recorded.

**Phase 6 — Branch & Draft PR Creation (HARD GATE)**
- Branch name must follow: `feat/issue-{N}-{description}`, `fix/issue-{N}-{description}`, etc. — where `{N}` is the confirmed Issue number from Phase 3.
- A **draft Pull Request** must be opened on GitHub (base: `main`, linked with `Closes #{N}`) **before** any implementation begins.
- If the feature branch or draft PR does not exist when Phase 12 begins: **STOP**. Return to Phase 6.

### Enforcement Rule

Every response that involves creating or modifying source code must confirm, before writing any code:

1. A GitHub Issue exists — record its number.
2. A feature branch exists on remote — confirm with `git ls-remote`.
3. A draft PR is open and linked to the Issue.

**Failure to satisfy all three conditions before writing code is a workflow violation.**

---

## Repository Audit Rules

Every repository audit must begin by enforcing these rules. No exceptions.

1. **Git is the source of truth for repository state.**
   Merged, ahead/behind, unique commits, branch status, working tree, and tracked files must be determined exclusively from Git commands.

2. **Graphify is the source of truth for architecture state.**
   Graphify answers: dependency impact, architectural overlap, duplicate implementation, bounded context ownership, coupling, and migration impact.
   Graphify does not determine Git actions.

3. **Never infer PR state from Git history.**
   A merge commit in `origin/main` indicates a PR was merged. It does not confirm open, draft, or closed state.
   If GitHub CLI is unavailable, report: "Unable to verify PR state."

4. **Never recommend destructive Git operations without evidence.**
   Do not use the phrase "Safe to Delete" or "Safe to Merge."
   Use instead:
   - Candidate for Branch Cleanup
   - Candidate for Commit Review
   - Candidate for Push Review
   - Appears Fully Merged (Git Evidence)
   - Requires Manual Review
   Deletion, merging, pushing, and committing are always human decisions.

5. **Separate verified facts from recommendations.**
   Report the fact first, then the recommendation separately.

   Fact:
   Branch has zero unique commits compared with the current branch.

   Recommendation:
   Candidate for cleanup after merge history and PR state are confirmed.

6. **Classify every file explicitly.**
   Clearly distinguish: Source Code, Test, Configuration, Documentation, Generated, Cache, Tool Output, Build Output.
   Generated files and tool outputs must never be committed.

7. **If evidence is unavailable, report: "Unable to verify."**
   Never assume, infer, or estimate repository state.

---

## Repository Audit Metrics Format

When reporting repository health, prefer measurable facts over prose summaries.

Example format:

```
Architecture Score       100 / 100
Dependency Violations    0
Circular Dependencies    0
Working Tree             17 modified · 10 untracked
Legacy Services          183
Direct Model Imports     284
```

---

## Repository Audit Execution Order (Mandatory)

Every repository audit must follow this sequence. Do not skip or reorder these steps.

1. Repository bootstrap (`AGENTS.md`)
2. Graphify availability check
3. Git repository state
4. Architecture verification
5. Graphify analysis
6. Cross-validation
7. Final audit report

---

## Evidence Requirement

Every conclusion in an audit must include supporting evidence.

Evidence may come from:
- Git
- Graphify
- Architecture verification
- Test results
- TypeScript compilation
- Dependency Cruiser
- Madge

If evidence cannot be produced, report:

Unable to verify.

---

## Documentation Ownership

Before adding any rule, instruction, workflow, or documentation, determine its owner.

**AGENTS.md**
- AI behavior
- Repository audit rules
- Git workflow
- Graphify workflow
- Verification rules
- Execution policies

**GOVERNANCE.md**
- DDD architecture
- Bounded contexts
- Ports & Adapters
- Naming conventions
- Repository architecture standards

**AI_WORKFLOW.md**
- AI execution lifecycle
- Phase gates
- Implementation workflow
- Verification workflow

**README.md**
- Human documentation
- Project overview
- Installation
- Setup
- Usage

**ARCHITECTURE.md**
- Architecture standard reference
- Bounded Context Map
- Pattern guidelines (Repository, UnitOfWork, Caching, Composition Root)

Never duplicate content between files.

If a new rule belongs to an existing owner, update that document instead of creating a new one.

---

## Graphify First Policy

For any task involving:
- Architecture
- Refactoring
- Migration
- Dependency analysis
- Impact analysis
- Coupling analysis
- Repository audit
- Commit partitioning
- Technical debt

Always:

1. Verify Graphify availability.
2. Use Graphify (MCP preferred, CLI if MCP unavailable).
3. Cross-check results with Git and repository verification tools.
4. State which Graphify interface was used (MCP or CLI).
5. Never perform architecture analysis without Graphify unless Graphify is unavailable.

---

## Zero-Leakage Architecture Rule

To maintain the integrity of the DDD Ports & Adapters architecture established in v2.5.0:

1. **No direct infrastructure leakage:** No new code, application services, or orchestrators may import or reference Mongoose models directly. They must interact with database schemas strictly via domain-defined **Repository Ports**.
2. **Abstract transaction boundaries:** All transaction control and session orchestration must go through **UnitOfWork Ports** using the opaque `session: unknown` signature. Direct references to Mongoose `ClientSession`, `startSession`, or `withTransaction` inside application services are strictly forbidden.
3. **Intent-focused caching:** Caching invalidation and read operations must be declared as business intent behind dedicated **Cache Ports**. Direct imports of low-level `redisCache` helpers into core services are not allowed.
4. **Enforced via composition:** All dependencies must be resolved and wired at the package boundary via factory functions inside **Composition Roots**.

---

## Strict Milestone Execution Rule

No new feature, refactor, or domain migration starts until all approved architectural, naming, and governance violations for the current milestone are resolved or formally deferred.

## Audit Finding Classification Policy

No recommendation from an audit may be implemented solely because it appears in the report. Every finding must be classified as one of:
- **Mandatory**: Violates an approved repository standard, architectural rule, governance policy, or documented ADR. Mandatory findings must be fixed immediately.
- **Recommended**: Improves consistency but is optional. Recommended findings require an explicit, approved implementation plan.
- **Accepted Deviation**: Not aligned with repository standards or provides no measurable benefit, but represents a conscious design decision or framework requirement. Accepted deviations are documented and left unchanged.

## Repository Standards Source of Truth

Every naming convention, architectural rule, directory convention, and dependency rule must have a single documented source of truth.

If a standard is not documented in AGENTS.md, GOVERNANCE.md, an approved ADR, or another designated governance document, it cannot be enforced as Mandatory.

## Repository Standard Evolution

Repository standards are versioned. Any new Mandatory standard must:
- Include written rationale
- Define migration strategy
- Identify affected packages
- Receive approval
- Update governance documentation



---

## Refactoring Exit Criteria (Mandatory Governance Rule)

A refactoring task is complete ONLY when all 7 criteria are satisfied:

1. **Functionality Unchanged**: All existing features, states, and user workflows behave identically.
2. **Public APIs Unchanged**: Internal refactoring must not break or modify public API contracts (unless explicitly approved in ADR).
3. **TypeScript Clean**: Monorepo type-check passes with exactly `0` errors across all packages (`npm run type-check`).
4. **Automated Tests Pass**: All existing unit and integration test suites pass with 100% green status.
5. **No Accessibility Regressions**: No new WCAG 2.2 AA accessibility violations or keyboard focus leaks are introduced.
6. **Measurable Duplication Reduction**: Code duplication is reduced or maintainability is measurably improved.
8. **Architecture Decision Record (ADR)**: Major refactorings require a brief ADR covering: rationale, alternatives considered, chosen option, risk analysis, and rollback strategy.
9. **Rollback Plan Verified**: Clear instructions for reverting changes, identifying impacted APIs/schemas, and validating post-rollback state.

---

## Similarity Threshold Governance Heuristic

Components, hooks, or services should be evaluated using similarity metrics:
- Shared UI %
- Shared business rules %
- Shared validation %
- Shared API contract %
- Shared workflow %

Consolidation is **recommended** when overall similarity > 75% AND no single dimension is < 50%. This threshold serves as a **governance heuristic**, not a rigid mechanical rule. Final consolidation approval requires an architecture review confirming that readability, domain boundaries, and long-term maintainability improve.



