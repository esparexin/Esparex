Purpose
This document is the runtime contract every AI agent executes — in order, without skipping — before, during, and after writing code in the Esparex repository.
Every phase declares authority, inputs, process, outputs, and exit criteria. Every exit produces exactly one of three outcomes: PASS, FAIL, or BLOCKED. Execution is deterministic.

Workflow Stability Principle
This document defines the AI execution lifecycle. It is repository-wide governance and must remain stable. Changes are permitted only when they improve the execution process for every repository feature. Feature-specific business rules, UI behavior, domain workflows, and implementation details must never be added here; they belong in feature-specific business rule documents.

Failure Policy
When any phase produces FAIL:

Stop immediately. Do not execute the next phase.
Emit a failure report: phase number/name, gate identifier, evidence collected, reason for failure, required remediation.
Do not reorder phases, skip gates, or continue under assumption.
Halt and wait for explicit user resolution.

Success Policy
When every phase produces PASS:

Execute Phase 18 — Completion Report.
Return the implementation summary per the Phase 18 template.
End execution.


Fast-Path Track
Applies only when all of the following are true, as determined in Phase 2:

Single file changed, or a config/copy/typo change touching no logic
Risk = Low and Complexity = Low
No schema, API contract, auth, or business-rule change
UI-modified = No, or a trivial style-only change with no new states/behavior

If all criteria are met, the AI may skip Phases 4, 8, 8.5, 9, 10, 11, 11.5, and 14, going Phase 3 → 5 → 6 → 7 → 12 → 13 → 15 → 16 → 17 → 18. Every skipped phase must still be logged as SKIPPED (Fast-Path) in the Phase 18 report — never silently omitted. If, once in Phase 7 or 12, the change turns out to touch more than the single file/area anticipated, the AI must stop, exit Fast-Path, and re-run the full lifecycle from Phase 4 forward (see Scope Ceiling below).
Scope Ceiling
If actual scope during Phase 7 (Discovery) or Phase 12 (Implementation) exceeds the Phase 1/2 estimate — e.g. more than roughly 3x the files, packages, or layers originally scoped — the AI must stop, report the discrepancy, and get the user to confirm or re-scope before continuing. Silent scope expansion is a blocking error.
Iteration Limit
Any gate that loops on FAIL ("fix and re-check") may attempt this at most 3 times for the same root cause. On the 3rd consecutive FAIL at the same gate for the same underlying issue, the AI must stop and escalate to the user with the failure history rather than continuing to retry.

Naming Policy (single source of truth)
Every artifact name created by this workflow follows one of these patterns. No phase may invent its own naming rule.
ArtifactPatternOwning PhaseBranchfeat|fix|refactor|chore/issue-{N}-{kebab-description}Phase 6CommitConventional Commits: type(scope): imperative lowercase summaryPhase 17PR titleSame as commit conventionPhase 17GitHub IssueDescriptive title, no ticket-number prefix (GitHub assigns it)Phase 3File / moduleMatches existing package convention discovered in Phase 7; never introduce a new convention mid-packagePhase 9, Phase 12ComponentPascalCase, one component per file, filename = component namePhase 12HookuseX camelCase, one hook per filePhase 12Type / interfacePascalCase, no I prefix, in shared/src/types/Phase 12Constant / enumSCREAMING_SNAKE_CASE for primitives, PascalCase for enum objects, in shared/src/constants/Phase 12
Any name that doesn't fit an existing pattern is a Verified Issue if it already exists in the repo, or a blocking error if about to be created — not a judgment call.

Evidence Standard (single source of truth)
Every finding, duplicate, or violation reported anywhere in this workflow — implementation, audit, or hygiene check — must be recorded in this exact form. No phase may use a lighter-weight or heavier-weight format.
Artifact:  <what was found>
Location:  <file path : line number>
Type:      Duplicate | Dead Code | Naming Violation | Lint Violation | Architecture Violation
Action:    Reuse | Extend | Remove | Rename | Escalate (Proposed Feature)
Statements like "there appear to be duplicates" or "this file looks unused" without a file:line are not evidence and cannot close a gate.
Decision Log: every piece of evidence produced by any phase is appended — not overwritten — to .agents/logs/DECISION_LOG.md (or the task's PR description if no log file exists yet), tagged with phase number and timestamp. This is what makes the AI's own behavior auditable after the fact; evidence that lives only in a chat transcript does not satisfy this requirement.

Phase Classification
TypeDefinitionExecution PhaseMandatory step producing output required by later phases.Execution GateMandatory validation checkpoint. PASS / FAIL / BLOCKED. Blocks continuation on failure.

Lifecycle Overview
Phase 0    — Context Loading                       [Execution Phase]
Workflow Gate 0 — Repository Discovery & Reuse     [Execution Gate]
Phase 1    — Request Analysis                       [Execution Phase]
Phase 2    — Task Classification                    [Execution Phase]
  Phase 2a–2f — Audit Sub-Phases (only if task = Audit)
Phase 2.5  — Skill Resolution                      [Execution Gate]

  ⚡ Fast-Path Track — eligible low-risk tasks may skip 4, 8, 8.5, 9, 10, 11, 11.5, 14

Phase 3    — Issue Validation                        [Execution Gate]
Phase 4    — Conflict Detection (open PR overlap)     [Execution Gate]
Phase 5    — Repository State Validation              [Execution Gate]
Phase 6    — Branch & Draft PR Creation                [Execution Gate]

Phase 7    — Live Repository Discovery               [Execution Phase]
Phase 8    — Policy Engine                            [Execution Phase]
Phase 8.5  — Impact Analysis                          [Execution Phase]

Phase 9    — Duplication & Reuse Gate                 [Execution Gate]
Phase 10   — Architecture Validation                  [Execution Gate]
Phase 11   — Pre-Implementation Quality Validation     [Execution Gate]
Phase 11.5 — Business Rules Verification Gate          [Execution Gate]

⛔ NO CODE MAY BE WRITTEN UNTIL PHASES 3–11.5 ALL PASS

Phase 12   — Implementation (incl. Data Migration Safety) [Execution Phase]

Phase 13   — Code Quality & Lint/Import Hygiene Gate   [Execution Gate]
Phase 14   — UI/UX Quality Validation (skills, mobile-first,
             responsive, performance)     [Execution Gate — Conditional]
Phase 15   — Repository Hygiene Validation             [Execution Gate]
Phase 16   — Verification Pipeline (incl. Secret/Dep Scan, coverage) [Execution Gate]

Phase 17   — PR Finalization                          [Execution Phase]
Phase 18   — Completion Report                        [Execution Phase]
Phase 19   — Post-Merge Monitoring                    [Execution Phase]
Global rules that apply across every phase: Scope Ceiling, Iteration Limit (max 3 retries per gate), Dependency Policy, Feature Flag Policy, Decision Log.

Phase 0 — Context Loading
Classification: Execution Phase
Process

Load .agents/AGENTS.md
Load .agents/governance/GOVERNANCE.md
Load .agents/workflow/AI_WORKFLOW.md (this document)
Load .agents/project/PROJECT_CONTEXT.json

Exit Criteria
| PASS | Core bootstrap files loaded |
| FAIL | Any core file missing, corrupt, unreadable |

Workflow Gate 0 — Repository Discovery & Reuse
Classification: Execution Gate
Process

Before creating any new component, hook, schema, utility, service, API, context, provider, or helper, the AI must perform a repository-wide search for an existing implementation.

### Mandatory Process
1. Search the repository for existing implementations.
2. Identify the canonical Single Source of Truth (SSOT).
3. Determine whether the existing implementation can:
   - Be reused,
   - Be extended, or
   - Be composed.
4. Only create a new implementation if no suitable reusable implementation exists.
5. If a new implementation is required, document the architectural justification.
6. If a new implementation replaces an existing one, include migration and cleanup of the legacy implementation in the same workstream whenever it is safe to do so.

### Prohibited
- Creating duplicate components.
- Creating duplicate hooks.
- Creating duplicate schemas.
- Creating duplicate utilities.
- Creating duplicate API clients.
- Creating duplicate validation logic.
- Creating parallel implementations without documented justification.

### Required Output
Before implementation, report:
- Existing implementations found.
- Canonical SSOT selected.
- Reuse decision.
- Architectural justification (only if creating something new).
- Legacy cleanup plan (if applicable).

Exit Criteria
| PASS | Repository-wide search completed, SSOT selected, reuse/cleanup plan documented |
| FAIL | Duplicates created without search or justification |

Phase 1 — Request Analysis
Classification: Execution Phase
Process

Read the full request before acting.
Extract explicit requirements.
Extract implicit requirements.
List assumptions (anything not directly verifiable from the request text). Every assumption is verified against live source in Phase 7.
Identify dependencies.
Define acceptance criteria.
Identify risks and constraints.


Definition of Done: the acceptance criteria defined here must be written so they map directly onto the Phase 18 Final Completion Checklist. If a criterion can't be verified against that checklist, it isn't a real acceptance criterion — reword it now, not at Phase 18.

Exit Criteria
| PASS | Requirements understood, acceptance criteria defined, assumptions logged |
| BLOCKED | Request ambiguous and cannot be resolved from the live repo — ask the user, halt |

Phase 2 — Task Classification
Classification: Execution Phase
Process
Assign classification label(s): Feature, Bug Fix, Refactoring, UI/UX, Backend, Database, DevOps, Security, Performance, Architecture, Repository Cleanup, Testing, Documentation, Governance, Audit.
Also determine: Scope (file / package / cross-package / full-stack), Complexity (low/medium/high), Risk (low/medium/high), UI-modified flag (Yes/No — gates Phase 14). This scope estimate is the baseline the Scope Ceiling rule checks actual work against later.
If classification includes Database, flag the task for the Data Migration Safety rule in Phase 12.
If Scope/Complexity/Risk all qualify as Low and the criteria in the Fast-Path Track are met, mark the task Fast-Path eligible.
If classification includes Audit, run Phase 2a–2f below before continuing to Phase 3. These are sub-phases of Phase 2, not standalone lifecycle phases — they can never be referenced as "Phase 3" etc.
Phase 2a — Repository Audit
Evidence-only findings across UI, UX, backend, API contracts, database models, mobile layout, duplicate code, dead code, legacy code, performance, security. Every finding uses the Evidence Standard and is classified: ✅ Verified Issue / 💡 Improvement Opportunity / 🆕 Proposed Feature / ❓ Needs Verification. No code, no solution names (see No-Solution Rule below).
Phase 2b — Root Cause Analysis
For each ✅ Verified Issue: Problem → Evidence → Root Cause → Impact → Severity. No code, no solution names.
Phase 2c — Business Rules Verification
For each in-scope field/flow: what the blueprint requires, what the live implementation does, whether they match. No code.
Phase 2d — Gap Analysis
For each mismatch: Current → Expected → Gap. Nothing else — no component names, no solutions.
Phase 2e — Implementation Options
Only after 2a–2d are complete and user-approved. For each gap: Option A (pros/cons), Option B (pros/cons), Recommended + one-sentence reason. Requires explicit user approval before Phase 2f.
Phase 2f — Approved Implementation
Only approved options proceed. Continues into the normal lifecycle at Phase 3, applying all gates (9–11.5) before any code is written.
No-Solution Rule (applies to 2a–2d)
Correct: "Current implementation mixes business state across several components."
Prohibited: "Therefore create PostAdStateController."
Naming a solution before the problem is understood and approved is a governance violation. Prohibited in findings: new controller/service/component/hook names, new architecture diagrams, new step names, any implementation-specific naming.
Exit Criteria
| PASS | Classification complete; if Audit, 2a–2d complete and (if applicable) 2e approved |

Phase 2.5 — Skill Resolution
Classification: Execution Gate
Process

Before any code changes are written or implementation plans are finalized, the AI must dynamically evaluate and resolve the active skill set required for the task.

### Mandatory Process
1. **Repository Discovery & Classification**: Leverage the results of live repository discovery and task classification (Phase 2) to determine the exact requirements of the task.
2. **Discover Available Skills**: Scan the standard customization roots (`.agents/skills/*`) and any custom mapped locations (`skills.json`) to find all available skills.
3. **Resolve Applicable Skills**: Map the requirements of the classified task against the frontmatter definitions (`name`, `description`) of the discovered skills. Select only the skills that directly govern the current task.
4. **Enforce Isolation & Ownership Boundaries**: Check all selected skills to ensure no duplicate responsibilities or conflicting directives exist. If any duplication or conflict is found, resolve it by prioritizing the most specific skill or consulting documented ownership boundaries.
5. **Log Resolution & Load**: Load only the finalized, non-overlapping subset of resolved skills. Record the resolution data.

### Required Output
For every task execution, the AI must record and include in the implementation plan / reports:
- **Skills Evaluated**: List of all skills discovered in the customization roots.
- **Skills Loaded**: List of skills selected and active for this task.
- **Skills Applied**: How each loaded skill directly guides or constraints the current task.
- **Skills Intentionally Skipped**: List of available but unselected skills, along with a clear reason why they were rejected.

Exit Criteria
| PASS | Skills resolved, loaded without conflicts, and resolution metadata recorded |
| FAIL | Overlapping skills loaded, or a required skill omitted, or conflicts unresolved |

Phase 3 — Issue Validation
Classification: Execution Gate
Process

Search GitHub Issues for existing coverage.
If found, record Issue number/title.
If not found, draft a complete Issue (title per Naming Policy, description, acceptance criteria, labels) and stop until created.

Exit Criteria
| PASS | Issue exists and is linked |
| FAIL | No Issue — draft it, halt until created |

Phase 4 — Conflict Detection
Classification: Execution Gate

Detects overlap in open PRs only. Does not create a PR — that's Phase 6.

Process

Inspect open PRs.
Search for overlap with this task's scope.
If overlap found, record PR number, stop.

Exit Criteria
| PASS | No overlapping open PR |
| FAIL | Overlap found — report it, do not duplicate in-progress work |

Phase 5 — Repository State Validation
Classification: Execution Gate
Process
git status
git log --oneline
Verify: working tree clean, no merge conflicts, no pre-existing build failures.
Exit Criteria
| PASS | Clean, no conflicts, no pre-existing failures |
| FAIL | Any of the above violated — report specifics |

Phase 6 — Branch & Draft PR Creation
Classification: Execution Gate
Process
Branch:

git branch — confirm not on main/develop.
If on main/develop, create branch per Naming Policy: git checkout -b feat/issue-{N}-{description}.
If a stale/merged branch exists, delete it, sync with base, create fresh.
git push -u origin {branch-name}.

Draft PR:
5. Open a draft PR: base main, head the new branch, title per Naming Policy, body includes Closes #{issue-number}.
6. Record the draft PR URL as evidence.

⛔ If either the branch or the draft PR is missing, do not proceed to Phase 7.

Exit Criteria
| PASS | Branch on remote AND draft PR open and linked to Issue |
| FAIL | Either missing — create, push, open, then re-check |

Phase 7 — Live Repository Discovery
Classification: Execution Phase

Only live source code and live git output are authoritative. Documentation, comments, and prior conversation are not evidence of current state.

Process
Answer explicitly: What exists? Where is SSOT? What depends on it? Can it be reused? What will break? Is there already an Issue?
Map for task scope: folder structure, workspace config, components (apps/*/src/components/), hooks (apps/*/src/hooks/), domain services (core/src/services/), routes (backend/api/src/routes/), controllers, middleware, utilities (core/src/utils/, shared/src/), validators (core/src/validators/), types (shared/src/types/), constants (shared/src/constants/), models (core/src/models/), test coverage.
Exit Criteria
| PASS | Live map complete; all Phase 1 assumptions verified |
| FAIL | Source inaccessible or assumption verification contradicts the plan |

Phase 8 — Policy Engine
Classification: Execution Phase
Process

Load .agents/policy_engine/POLICY_ENGINE.json.
Map Change Type × Repository Discovery × Project Context.
Load only the Required Skills, Required Rules, Required Verification, and Priority the engine dictates. Load nothing else.

Exit Criteria
| PASS | Policy Engine executed, task-specific context loaded |

Phase 8.5 — Impact Analysis
Classification: Execution Phase
Process
Before writing code, analyze and persist (not "internal memory only") the cross-boundary impact:

API impact — frontend client updates needed?
Database impact — migrations/index changes?
Frontend impact — breaks existing UI state?
Admin impact — does admin need awareness?
Testing impact — which suites break?

Outputs
Persisted Impact Surface Map, same Evidence Standard as every other phase — available to the user on request, not discarded.
Exit Criteria
| PASS | Impact surface mapped and persisted across all domains |

Phase 9 — Duplication & Reuse Gate
Classification: Execution Gate

This is the single duplicate-detection gate in this workflow. All other phases (Conflict Detection, Repository Hygiene, Audit) reference this gate's Evidence Standard rather than defining their own.

Process
Before creating any new artifact, search existing locations:
ArtifactSearch LocationHookapps/*/src/hooks/Componentapps/*/src/components/Service methodcore/src/services/API endpointbackend/api/src/routes/Utility functioncore/src/utils/, shared/src/Validator / schemacore/src/validators/Type / interfaceshared/src/types/Constant / enumshared/src/constants/Middlewarebackend/api/src/middleware/Business logiccore/src/services/
For every match or near-match, record it using the Evidence Standard (file:line, Type: Duplicate, Action: Reuse/Extend/Remove). Extend existing files instead of creating new ones whenever practical.
Exit Criteria
| PASS | Every required artifact resolved to Reuse/Extend, or new creation is justified with evidence that no existing artifact fits |
| FAIL | A duplicate would be created without evidence-backed justification |

Phase 10 — Architecture Validation
Classification: Execution Gate
Process
Validate against invariants: dependency direction (Apps → API → Core → Shared, no upstream imports), no circular dependencies, Core is framework-independent (no Express/HTTP in core/src/), controllers stay thin (no DB queries/business logic), no direct model access from apps/*, transactions live only in core/src/services/, UI components are presentational (no direct fetch calls), correct layer ownership, backward compatibility (breaking changes need an ADR), new packages need an ADR.
Exit Criteria
| PASS | All invariants confirmed unviolated |
| FAIL | Any invariant violated — list each, do not implement until corrected |

Dependency Policy
Applies whenever Phase 9 or Phase 12 would introduce a new third-party package. Before adding it:
RequirementStandardJustificationState why an existing dependency or in-repo utility can't do this — checked against Phase 9's reuse mapLicenseMust be a permissive license (MIT, Apache-2.0, BSD, ISC); anything else requires explicit user approvalMaintenance healthLast published/updated within a reasonable window (e.g. 12 months); flag abandoned packagesBundle size impactFor frontend packages, report the added size against the Phase 8.5 impact budgetVulnerability statusZero known critical/high vulnerabilities at time of adding (checked again in Phase 16 step 9)
Failing any of these is a Phase 9/10 blocking issue, not a Phase 16 surprise — catch it before implementation, not after.
Feature Flag Policy
For Medium/High risk changes (per Phase 2 classification) that can be decoupled from a single release, prefer shipping behind a feature flag over a big-bang merge:

New/risky behavior defaults off in production until explicitly enabled.
Flag name follows the Naming Policy constant convention.
Flag removal (cleanup of dead flag branches) is tracked as a follow-up Issue, not left indefinitely — an unremoved flag older than the agreed cleanup window is a Repository Hygiene (Phase 15) finding.

This is a recommendation the AI should surface for Medium/High risk tasks, not a hard gate — the user makes the final call on whether a flag is warranted.

Skill Loading Policy
Applies to every task and prompt execution in this workspace.

* **Live Discovery First**: Perform repository discovery and scan active customization folders (`.agents/skills/*` or `skills.json`) before loading any AI skills.
* **Relevance & Minimalism**: Load only the relevant skills required for the task. Never load unnecessary skills.
* **Single Source of Truth**: Use each loaded skill as its single source of truth for its domain.
* **Zero Duplication**: Never duplicate rules or guidance already owned by another skill inside `AGENTS.md`, `AI_WORKFLOW.md`, or other skills.
* **Ownership Invariants**: Ensure loaded skills have clear, non-overlapping responsibilities. Resolve conflicts using documented ownership boundaries.
* **Traceable Reporting**: The active skill configuration (skills evaluated, loaded, applied, and skipped with justification) must be documented in the implementation plan and completion reports.

Phase 11 — Pre-Implementation Quality Validation
Classification: Execution Gate
Process

Execute .agents/verification/pre_implementation.md.
Confirm draft PR open, branch on remote, reuse map from Phase 9 applied.
Apply domain-specific rules from Phase 8.
Confirm duplicate, dead-code, and orphan audits (Phase 9) are documented or resolved.

Exit Criteria
| PASS | Checklist complete, all gates passed |
| FAIL | Any item incomplete — resolve before implementation |

Phase 11.5 — Business Rules Verification Gate
Classification: Execution Gate
Mandatory for any task touching a field, form, workflow, or state with defined business rules.
Process
For each in-scope rule, verify consistency: Blueprint → UI → API → Backend → Database → Admin (if applicable) → only then Implementation.
Business RuleBlueprintUIAPIBackendDatabaseAdminStatus
Exit Criteria
| PASS | All in-scope rules verified consistently across every applicable layer |
| FAIL | Any layer contradicts the rule — document the contradiction, do not implement |

Phase 12 — Implementation
Classification: Execution Phase
Trigger: Only after Phases 3–11.5 all PASS.

⛔ Before writing code, confirm: on a feature branch (not main/develop), branch exists on remote, draft PR open and linked. If any fails, return to Phase 6.

Build Order

Contract types — shared/src/types/
DTO schemas — core/src/validators/
Database models — core/src/models/
Domain services — core/src/services/
Unit tests
Controllers — backend/api/src/controllers/
Route bindings — backend/api/src/routes/
Integration tests
OpenAPI specs
UI components

Data Migration Safety (mandatory for Database-classified tasks)

Every migration must be backward-compatible with the previous schema version for at least one deploy cycle (expand/contract pattern — no destructive change in the same migration that adds it).
A dry-run against a non-production copy of the data is required before the migration is considered implemented.
A rollback migration must be written alongside the forward migration, not authored later.

Implementation Invariants (continuous, any violation is blocking)
InvariantRuleNo debug outputconsole.log/debug/error banned in committed codeNo TODOsTODO, FIXME, HACK bannedNo placeholder codeEvery function fully implementedNo commented-out codeDeleted code is deletedNo hardcoded secretsEnv vars onlyNo unused variablesEvery declared variable consumedNo unused importsEvery import consumed — checked here, enforced as a gate in Phase 13No unused exportsEvery export has a consumer — checked here, enforced as a gate in Phase 13No dead codeUnreachable paths removedNo partial implementationsComplete when committedNo temporary filesNo _backup, _temp, _wipNamingFollows the Naming Policy — no ad hoc conventions
Exit Criteria
| PASS | Implementation complete, invariants satisfied |
| FAIL | Any invariant violated — fix before proceeding |

Phase 13 — Code Quality & Lint/Import Hygiene Gate
Classification: Execution Gate

This gate owns import/lint hygiene. Phase 16 re-runs the automated lint command as a pipeline step but does not redefine the standard — if Phase 16's lint step fails, it is a re-trigger of this gate, not a new one.

Process
CheckStandardFile size and focusA file serving more than one clear concern must be splitFunction focusEvery function does exactly one thingImport hygieneSorted (external → internal → relative); zero unused imports; zero duplicate importsExport hygieneZero unused exportsLazy loadingDynamic imports where full module load at startup isn't requiredRender efficiencyNo unnecessary re-renders from unstable refs, missing memoization, bad dependency arraysAPI deduplicationNo duplicate requests for the same data in one interactionCouplingNo new tight coupling between previously-independent layersNamingMatches Naming Policy exactly
Exit Criteria
| PASS | All checks pass, zero unused imports/exports, naming conforms |
| FAIL | Any check fails — fix, re-validate from Phase 13 |

Phase 14 — UI/UX Quality Validation
Classification: Execution Gate — Conditional (only if UI-modified = Yes)
Process
Skills: before writing or reviewing any UI code, load the relevant design/frontend skill(s) (e.g. frontend-design) — this is not optional for UI-modified tasks. Visual and interaction decisions must follow the skill's design tokens and constraints, not ad hoc defaults.
Mobile-first & fully responsive:
CheckStandardBaselineSmallest breakpoint (mobile) is designed first, not adapted from desktop after the factBreakpointsVerified at mobile, tablet, and desktop — layout must not break at any of themNo horizontal scrollAt any breakpointTouch targetsMinimum 44×44px on mobile, adequate spacing between tappable elementsFluid layoutNo fixed pixel widths that overflow smaller viewports; use relative units
Performance / page speed:
CheckStandardCore Web VitalsLCP < 2.5s, CLS < 0.1, INP < 200ms on a throttled mobile profileImage optimizationCorrectly sized, modern format, lazy-loaded below the foldBundle impactNew UI code doesn't regress the route's JS bundle size beyond the budget set in Phase 8.5Render blockingNo unnecessary blocking scripts/styles added to the critical path
Accessibility: full keyboard navigation, semantic HTML, correct ARIA, focus trapping/restoration, WCAG AA contrast.
UI States: loading, empty, error (actionable), success, inline validation — all implemented per interactive element.
Functional completeness: every button has a real action (onClick={() => {}} banned), every link resolves, every form submits to a real endpoint, modals open/submit/close correctly, no orphan UI.
Exit Criteria
| PASS | All checks pass, including mobile-first/responsive and performance budgets |
| FAIL | Any check fails — fix, re-validate |
| SKIP | UI-modified = No |

Phase 15 — Repository Hygiene Validation
Classification: Execution Gate
Process

Execute .agents/verification/repository_cleanup.md.
Verify no temp files (*.tmp, *.bak, _wip, scratch-), debug output, or orphan files remain.
If new documentation is created, apply .agents/verification/documentation_gate.md — must not be duplicative, must provide long-term value.


Any duplicate found here follows the Phase 9 Evidence Standard — same format, no separate rule.

Exit Criteria
| PASS | Working tree contains only intended files |
| FAIL | Disallowed files found — remove, re-validate |

Phase 16 — Verification Pipeline
Classification: Execution Gate
Process
Run in order; any failure means fix and re-run all steps from step 1 (subject to the global Iteration Limit and the Flaky Test Policy below):
1. npm run format
2. npm run lint                 # re-runs Phase 13's standard, does not redefine it
3. npm run test:unit            # must meet the coverage threshold below
4. npm run test:integration
5. npm run type-check
6. npm run build
7. npm run guard:platform-governance
8. npm run repository:doctor -- --profile ci
9. npm run audit:secrets && npm run audit          # Secret & Dependency Scan
If UI-modified = Yes, also:
10. npm run test:e2e
Coverage threshold: new or changed code introduced by this task must meet the repository's configured minimum coverage threshold (branch + line). A passing test:unit run with coverage below threshold is a FAIL, not a PASS.
Secret & Dependency Scan (step 9): no leaked credentials, API keys, or tokens in the diff; no newly introduced dependency with a known critical/high vulnerability. Any hit is a FAIL — remove the secret/rotate it, or address the vulnerable dependency per the Dependency Policy.
Flaky Test Policy: a test is only treated as flaky if it has a documented history of intermittent failure unrelated to this change (tracked in the repo's flaky-test registry). A flaky test's failure does not block this gate, but it must be logged (Evidence Standard) and reported in Phase 18 as a known flake — it may never be silently skipped or deleted to make the gate pass. A test failing for the first time is never assumed flaky.
Exit Criteria
| PASS | All applicable steps pass with zero errors and coverage above threshold; no unjustified eslint-disable, as, or !; no secrets or critical/high vulnerabilities found |
| FAIL | Any step fails — fix, re-run from step 1 (see Iteration Limit) |

Phase 17 — PR Finalization
Classification: Execution Phase
Process
Commits: every commit follows the Naming Policy commit convention (enforced by commitlint.config.js).
PR body:
FieldRequirementTitleNaming Policy PR title formatIssue referenceCloses #<issue-number>DescriptionWhat changed and why — not a copy of the commit logTesting evidencePhase 16 pipeline outputRollback strategySteps to revertKnown risksLimitations, deferred workArchitecture checklistREPOSITORY_GOVERNANCE_STANDARD.md §10
Finalize: mark draft → Ready for review, confirm CI passes on remote. Never merge automatically, self-approve, or bypass CI.
Exit Criteria
| PASS | Commits conventional, PR ready, fields complete, CI passing remotely |
| FAIL | Any violation — fix and re-validate |

Phase 18 — Completion Report
Classification: Execution Phase
Note: This is the only name for this phase — it is not separately called "Response Formatter" elsewhere in this document.
Process
Output a deterministic, machine-readable summary:
✓ Discovery Complete
✓ Existing implementation reused (Phase 9 evidence attached)
✓ Duplicate logic not introduced
✓ Verification Passed

Changed
- <File 1>
- <File 2>

Checks
✓ Skill Resolution (evaluated, loaded, applied, skipped recorded)
✓ Typecheck
✓ Build
✓ Lint & Import Hygiene
✓ Repository Rules
✓ UI/UX Validation (if applicable)

Next
<Concise prompt for next action>
Final Completion Checklist
Status is Completed only when every item is satisfied; otherwise In Progress.

 Working tree clean — git status
 All commits present locally — git log
 Feature branch used (not main) — git log --oneline
 Branch on remote — git ls-remote
 Pull Request URL confirmed (real GitHub link, not a walkthrough artifact)
 PR linked to Issue (Closes #N)
 CI passed on remote — link attached
 PR not self-approved or auto-merged
 No temporary artifacts remain
 Documentation matches actual repository state
 Completion Report populated with objective evidence for every field

Exit Criteria
| PASS | Every checklist item satisfied, report provided — execution complete |
| FAIL | Any item unverified — do not declare completion |

Phase 19 — Post-Merge Monitoring
Classification: Execution Phase
Trigger: After the PR from Phase 17/18 is merged. Mandatory for Medium/High risk tasks; optional but recommended for Low risk.
Process

Define the monitoring window up front (e.g. 24–72 hours based on risk level) and what "healthy" looks like (error rate, latency, relevant business metric) — this should be stated before merge, not improvised after.
Watch error rates, logs, and the defined metrics for the window.
If a regression attributable to this change appears, trigger the rollback strategy documented in the Phase 17 PR body — do not attempt a live fix under pressure without user sign-off.
Record the outcome (healthy / rolled back / rolled back and reworked) in the Decision Log.

Exit Criteria
| PASS | Monitoring window completed with no attributable regression, or a regression was caught and rolled back per plan |
| FAIL | A regression occurred and no rollback strategy existed, or rollback was attempted without following the documented plan |

Audit Governance Rules
Applies to every task classified Audit (Phase 2, sub-phases 2a–2f).
Audit means audit. Verify implementation, business rules, UI/UX, backend, repository quality. Identify root causes. Produce evidence. Do not introduce new features or architecture.
No new feature suggestions during an audit unless explicitly requested by the user.
Recommendation rule: if current implementation genuinely cannot solve the problem without new functionality, stop and produce a Proposed New Feature document (fields: Feature Name, Problem Being Solved, Why current system can't solve it, Business/Technical/UI/Backend/Repository impact, Alternative approaches, Risks). No implementation details. Requires explicit user approval before it enters scope.
Finding classification (used throughout, including Phase 2a):

✅ Verified Issue — implementation is incorrect, evidence required, may be fixed without extra approval.
💡 Improvement Opportunity — works correctly, optional, no business-behavior change, needs approval to implement.
🆕 Proposed Feature — not an audit finding, separate proposal, needs approval, follows the format above.
❓ Needs Verification — insufficient evidence, no conclusion until resolved.
❓ Needs Catalog Verification — business rule depends on product catalog data not yet confirmed. No conclusion until catalog data is verified; then reclassify.
⏳ Awaiting Business Approval — business rule exists in draft or proposed state. No implementation until product owner provides explicit approval; then reclassify as ✅ Verified Issue or remove.

Implementation protection: implementation may only address ✅ Verified Issues. 💡 and 🆕 require explicit approval first. Violating this is unauthorized scope expansion — a blocking error.

Audit document structure and approval stamp format are defined in `.agents/templates/AUDIT_TEMPLATE.md`.