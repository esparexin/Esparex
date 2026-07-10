# Agent Rules & Constraints

## Rule 1 — Evidence Before Reporting

Never report any task as completed unless it has been verified with objective evidence.

Evidence may include:
- Git output
- GitHub output
- CI logs
- Test results
- Build output
- Repository state
- Command output

If evidence is unavailable, explicitly state:
- attempted
- verified
- unverified
- blocked

Never infer completion.

## Rule 2 — Mandatory Stop Gate

If any verification fails or cannot be completed:

STOP.

Do not continue to later steps.

Do not mark the task complete.

Resolve the failure first.

## Rule 3 — Repository First

The repository is the Single Source of Truth.

Documentation,
implementation plans,
AI conversations,
and assumptions
must never override the live repository.

## Rule 4 — No Simulated Operations

Never claim that any Git or GitHub operation completed without direct evidence.

This includes:
- commit
- push
- tag
- branch creation
- branch deletion
- PR creation
- PR merge
- CI success
- workflow completion
- release creation

If verification is unavailable,
state that it is unverified.

## Rule 5 — Completion Gate

Every implementation ends with:

Repository Verification
↓
Git Verification
↓
Remote Verification
↓
CI Verification
↓
Documentation Verification
↓
Only then
Completed

## Rule 6 — Report Facts Only

Reports must distinguish between:
- Completed
- Verified
- Observed
- Expected
- Planned
- Recommended
- Assumed

Never mix these categories.

## Rule 7 — Branch Protection

Never bypass the intended repository workflow.

If the governance requires Pull Requests,
do not merge directly into protected branches.

Document any exception.

## Rule 8 — Final Verification Checklist

Before marking any project complete, verify:
* [x] Working tree is clean (`git status`)
* [x] Expected commits exist (`git log`)
* [x] Remote branches exist (`git ls-remote`)
* [x] Required tags exist (`git ls-remote --tags`)
* [x] CI passed (verified from GitHub or CI output)
* [x] Required reviews completed (if PR workflow is required)
* [x] Target branch contains expected commit
* [x] No temporary test artifacts remain
* [x] Documentation matches repository state

If **any** item is missing or unverified, the project status must remain **In Progress** rather than **Completed**.
