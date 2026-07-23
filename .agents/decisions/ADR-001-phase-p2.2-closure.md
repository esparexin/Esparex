# Architecture Decision Record — ADR-001

**Status**: Accepted
**Date**: 2026-07-22
**Deciders**: Engineering Lead
**Context**: Post-Sprint 2 retrospective, Phase P2.2 closure

---

## Decision

**Program 2 Phase P2.2 is declared complete.**

The "split large files" program is retired. Sprint 3 will not continue under Phase P2.2.

---

## Rationale

### What P2.2 accomplished

| Sprint | Outcome |
|---|---|
| Sprint 1 | Eliminated 6 architectural hotspots via modularization, async-storage consolidation, and context decomposition |
| Sprint 2 | Eliminated 4 Category A (≥500 LOC, multi-responsibility) UI hotspots |
| Combined | Architecture score: 100/100 · 0 circular deps · 0 type errors · all tests green |

### Why the program must stop here

The remaining ≥500 LOC files are **Category B** — cohesive, single-responsibility files that are large because they are complete domain implementations:

- `client.ts` — HTTP client
- `locationService.ts` — Location domain utilities
- `Ad.ts` — Core domain model
- `validation.ts` — Zod schema registry
- `SmartAlertService.ts` — Alert mutation service

Splitting these would produce artificial boundaries with no architectural benefit. **Large ≠ bad.**

### The Category B rule is now a permanent governance constraint

> A file must not be decomposed solely because it exceeds a line count threshold.
>
> Decomposition is required only when a file contains **multiple distinct responsibilities** with clear architectural seams.
>
> A completed audit that concludes "no refactoring required" is a **successful audit outcome**, not a failure.

---

## What changes

### Retiring

- The Sprint N / "Category A hotspot reduction" backlog format
- LOC as a primary architectural signal
- Automatic continuation of the split-files program

### Establishing

**Program 3 — Architecture Optimization & Maintainability**

> **Goal**: Improve architectural quality through evidence-based responsibility analysis while preserving behavior and API stability.

Every candidate must complete a **responsibility-based audit** before any implementation is planned. Audits produce one of a defined set of outcomes.

---

## Audit Outcome Decision Matrix

Every audit must conclude with exactly one of the following outcomes:

| Outcome | Meaning |
|---|---|
| **No Action** | File is cohesive; leave it unchanged. |
| **Extract Component** | Separate UI responsibilities into focused, independent components. |
| **Extract Hook** | Separate reusable React state or effect logic into a custom hook. |
| **Extract Service** | Move business logic out of a UI or context file into a service. |
| **Extract Utility** | Isolate pure helper functions into a dedicated utility module. |
| **Split Domain** | Break a file because it spans multiple distinct bounded contexts. |
| **Needs Further Investigation** | Insufficient evidence to recommend a change; requires deeper analysis. |

> **Governing rule**: `No Action` is a complete, successful audit outcome — not a failure. Refactoring is never the default.

---

## Objective Audit Scoring Criteria

### Gate 0 — Mandatory Cohesion Check (Before Scoring)

Before applying the numeric rubric, answer these three questions:

1. Does this file have a **single primary responsibility**?
2. Does it represent a **single bounded context**?
3. Is the current structure **understandable and maintainable**?

> If all three answers are **yes**, classify the file as **No Action immediately**.
> The scoring rubric below applies only to files that fail this initial cohesion check.

This prevents a cohesive, complex file from receiving an artificially high score simply because its domain is intrinsically large.

### Scoring Rubric (applied only if Gate 0 fails)

Before any implementation begins, score each candidate against these architectural indicators. Each criterion is scored **0–5**.

| Criterion | 0 | 5 | Score |
|---|---|---|:---:|
| **Multiple responsibilities** | Single clear responsibility | Multiple unrelated concerns | |
| **Coupling** | Few imports, narrow interface | High import fanout, deep prop drilling | |
| **Cognitive complexity** | Straightforward linear logic | Nested conditionals, async chains, mixed concerns | |
| **Duplicate business logic** | No duplication detected | Same logic copy-pasted across files | |
| **UI composition complexity** | Single cohesive UI unit | Multiple unrelated UI sub-sections in one render | |
| **State management complexity** | Simple local state | Interleaved refs, effects, and lifted state | |
| **Testability** | Easily unit-testable | Difficult to test in isolation | |
| **Public API impact** | Stable, narrow public surface | Broad, frequently changed public surface | |
| **Risk of regression** | Low — well-covered by tests | High — sparse coverage, complex side effects | |

### Score → Recommended Action

| Total Score | Classification | Recommended Action |
|:---:|---|---|
| 0–10 | Cohesive | **No Action** |
| 11–18 | Optional | Refactoring optional; proceed only if there is a clear specific benefit |
| 19–30 | Recommended | Architectural benefit is clear; include in sprint backlog |
| 31–45 | High Priority | Primary candidate; address before lower-scoring files |

> Thresholds are a starting point and may be calibrated as Program 3 progresses.

---

## Governance Rule Amendment

The following rule is permanently appended to the Architecture Governance Standard:

> **Responsibility-First Refactoring Rule**
>
> 1. Every refactoring candidate must complete a scored responsibility audit before implementation begins.
> 2. The audit must document: responsibilities identified, coupling assessment, cognitive complexity notes, scoring breakdown, and recommended outcome.
> 3. Valid outcomes are: `No Action`, `Extract Component`, `Extract Hook`, `Extract Service`, `Extract Utility`, `Split Domain`, or `Needs Further Investigation`.
> 4. `No Action` is a complete and successful audit outcome.
> 5. File size alone is never sufficient justification for refactoring.
> 6. Any file scoring below 11 must not be modified under a refactoring task.

---

## P2.2 Final Baseline

```
Commit:   9a782218 (develop)
Tags:     p2.2-sprint1, p2.2-sprint2
Score:    Architecture 100/100
Deps:     0 circular
Types:    0 errors
Tests:    102 suites · 560 tests · 100% green
Category A hotspots: 0
```

---

## Program 3 Workflow

1. **Audit all Sprint 3 candidates** using the objective scoring criteria above.
2. **Produce a scored, ranked backlog** ordered by total score descending.
3. **Accept that some candidates may receive No Action** — this is expected and healthy.
4. **Implement only candidates with clear architectural justification** (score ≥ 19, or ≥ 11 with a specific identified benefit).
5. **Validate the same quality gates** used in Programs 1 and 2:
   - `npm run type-check` — 0 errors across all packages
   - `npm run verify:architecture` — 100/100
   - `npm run guard:circular` — 0 circular deps
   - All test suites green
   - Build clean

---

## Audit Accuracy Tracking

Record the following for each Program 3 audit sprint to evaluate whether the audit process itself is effective:

| Metric | Description |
|---|---|
| **Audited files** | Total files reviewed in the sprint |
| **No Action decisions** | Count and % of files intentionally left unchanged |
| **Refactored files** | Files that proceeded to implementation |
| **Post-refactor regressions** | Bugs or type errors introduced by a refactor |
| **Refactors later reverted** | Refactors undone in a subsequent sprint |
| **Gate 0 passes** | Files that passed cohesion check without scoring |
| **False Positive Rate** | % of nominated candidates that received No Action |

> **False Positive Rate** is not a failure metric — it is a health metric. A rate of 50–85% indicates the audit process is functioning as a genuine filter. A rate near 0% suggests candidate selection has reverted to metric-driven targeting rather than evidence-based evaluation.

A healthy audit process should show a meaningful percentage of **No Action** decisions. A program where every audit concludes with implementation is a signal that the audit is not functioning as a genuine filter.

