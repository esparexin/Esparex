---
name: clean-code
description: Execute the Clean Code Standard repository verification and hygiene audit before analyzing or implementing code.
---
# Code Clean Skill

## Rule 0 — Repository Verification (Mandatory)

Before performing any audit, analysis, recommendation, or implementation, verify that the audit is being executed against the **live local repository**.

Do not rely on:

- Memory
- Previous conversations
- Cached repository knowledge
- Documentation alone
- Individual files provided outside the repository
- Assumptions

The local repository is the single source of truth.

---

## Repository Verification Checklist

Verify:

- Current repository
- Repository root
- Current branch
- Git status
- Working tree status
- Latest local commits
- Local branches
- Remote tracking branch
- Monorepo structure
- Workspace configuration

Record:

- Repository name
- Active branch
- Commit SHA
- Working tree state
- Modified files
- Untracked files

If the repository cannot be verified:

STOP.

Do not continue with the audit.

Request access to the local repository.

---

## Repository Discovery

Build an inventory before analyzing code.

Discover:

- Applications
- Packages
- Modules
- Components
- Hooks
- Services
- Utilities
- Contexts
- Types
- Interfaces
- APIs
- Middleware
- Validators
- Assets
- Tests

Create a dependency map.

Only after discovery may analysis begin.

---

## Repository Indexing

Index:

- Imports
- Exports
- References
- Call hierarchy
- Component usage
- Hook usage
- Service usage
- API ownership
- Type ownership
- Shared package usage

Every later finding must reference this index.

---

## Search Strategy

Always search the repository before making recommendations.

Search for:

- Existing implementations
- Similar functionality
- Duplicate names
- Alternative names
- Shared abstractions
- Deprecated implementations

Never create new code before confirming equivalent functionality does not already exist.

---

## Repository Evidence Rule

Every finding must include repository evidence.

Evidence should include:

- File
- Symbol
- Reference count
- Import chain
- Export chain
- Call sites
- Dependency chain

No evidence = no finding.

---

## Audit Order

Always execute in this order:

1. Repository Verification
2. Repository Discovery
3. Repository Indexing
4. Existing Implementation Search
5. Duplicate Detection
6. Dead Code Detection
7. Legacy Detection
8. Architecture Review
9. Repository Hygiene
10. Quality Report

Do not skip steps.
