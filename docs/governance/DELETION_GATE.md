# ESPAREX Repository Deletion Gate (Mandatory)

**Effective:** 2026-07-19  
**Scope:** All architecture cleanup, refactoring, and duplicate removal work  
**Authority:** Repository Governance

---

## Overview

A file may only be deleted if **all** of the following criteria are satisfied.

When there is uncertainty, preserve the file. Deletion requires positive evidence that it is obsolete.

---

## The 10 Mandatory Deletion Criteria

### 1. Canonical Implementation Exists

✅ **Requirement:**
* A verified replacement exists in the codebase
* The replacement is the designated Single Source of Truth (SSOT)
* The replacement is actively maintained

❌ **Blocks deletion:**
* No replacement exists
* Replacement is incomplete or partial
* Multiple competing implementations

---

### 2. Public API Protection

✅ **Requirement:**
The file is **not**:
* Exported by any `index.ts` barrel file
* Exported by `package.json` `exports` field
* Exported by `package.json` `types` field
* Referenced by TypeScript path aliases in `tsconfig.json`
* Part of the package's documented public API
* Listed in package README or API documentation

❌ **Blocks deletion:**
* Any of the above conditions are true
* File is part of a public package interface

---

### 3. Dependency Analysis

✅ **Requirement:**
The file has:
* No active `import` statements from anywhere in the codebase
* No dynamic imports (e.g., `require()` in Node, `import()` expressions)
* No runtime references via string paths
* No reflection-based usage (e.g., `__dirname`, metaprogramming)
* No dependency injection registration (Spring, NestJS decorators, etc.)

**Verification method:**
```bash
git grep -n "from.*<file-path>"
git grep -n "require.*<file-path>"
git grep -n "<file-name>"  # grep imports by name
```

❌ **Blocks deletion:**
* Any import found
* File referenced by name in non-obvious ways

---

### 4. Test Protection

✅ **Requirement:**
The file is **not**:
* Imported by unit tests (`.test.ts`, `.spec.ts`)
* Imported by integration tests
* Imported by e2e tests
* Referenced in test fixtures or mock setup
* Used by test utilities or test helpers
* Referenced in test snapshots

**Verification method:**
```bash
git grep -n "<file-name>" -- "**/*.test.ts" "**/*.spec.ts"
git grep -n "<file-name>" -- "**/__tests__/**"
```

❌ **Blocks deletion:**
* Any test file dependency found

---

### 5. Configuration Protection

✅ **Requirement:**
The file is **not**:
* Build configuration (webpack, tsconfig, vite, etc.)
* CI/CD configuration (GitHub Actions, CircleCI, etc.)
* Environment configuration (.env, .env.example, etc.)
* Mobile platform configuration (Android, iOS, Cordova, Capacitor)
* Deployment configuration (Docker, K8s, etc.)
* Code generation input (OpenAPI specs, GraphQL schemas, etc.)
* Linter/formatter configuration (ESLint, Prettier, etc.)

❌ **Blocks deletion:**
* File is any configuration file

---

### 6. Repository Role

✅ **Requirement:**
The file is **not**:
* A package entry point (`index.ts`, `index.js`)
* A barrel export (used only for re-exporting)
* An interface or contract definition (TypeScript interfaces, Zod schemas, etc.)
* A shared controller/helper across domains
* A database migration
* A database schema or entity model
* A shared kernel component

**Examples that block deletion:**
* `src/index.ts` (package entry)
* `src/types/index.ts` (barrel export)
* Anything in `shared-kernel/`
* Any file ending in `.schema.ts`, `.model.ts`, `.entity.ts`

❌ **Blocks deletion:**
* File serves as any of the above roles

---

### 7. Functional Equivalence

✅ **Requirement:**
The canonical implementation provides equivalent behavior.

Removing the file must **not**:
* Remove functionality available in the current codebase
* Change observable behavior of any system
* Change public APIs or contracts
* Change function signatures or types
* Change data formats or transformations

**Verification method:**
```bash
# Compare files line-by-line
diff <current-file> <canonical-replacement>

# Check for functionality in current file not in canonical
grep -v "^#" <current-file> | grep -v "^//" | grep -v "^[[:space:]]*$"
```

❌ **Blocks deletion:**
* Canonical is not functionally equivalent
* Current file has logic not present in replacement

---

### 8. Runtime Validation (CI Gate)

✅ **Requirement:**
After deletion, the following checks must succeed:

- [ ] `pnpm install` (or `npm install`)
- [ ] `pnpm type-check` (or `tsc --noEmit`)
- [ ] `pnpm lint` (or equivalent)
- [ ] `pnpm build` (or equivalent)
- [ ] `pnpm test` (all unit tests pass)
- [ ] `pnpm test:integration` (if applicable)
- [ ] Full CI/CD pipeline passes

**All checks must succeed. If any check fails, do not merge.**

❌ **Blocks deletion:**
* Any check fails
* CI pipeline is red

---

### 9. Review Classification

✅ **Requirement:**
Every proposed deletion must be classified as exactly one of:

**Approved** — Safe to remove.
* All 8 criteria above are satisfied
* Static analysis passed
* Runtime validation passed
* Clear deletion path

**Deferred** — Requires architectural refactoring first.
* File is mislocated (not a duplicate)
* File needs relocation before deletion
* File requires refactoring before removal
* Schedule separate PR for relocation

**Manual Review** — Insufficient evidence to delete.
* Edge case or ambiguous situation
* Requires human domain expert judgment
* Flag for code review with specific questions

**Blocked** — Protected by API, configuration, or runtime dependency.
* Public API (cannot delete)
* Core runtime dependency (cannot delete)
* Configuration file (cannot delete)
* Do not attempt deletion

---

### 10. Default Rule

✅ **When there is uncertainty, preserve the file.**

Deletion requires **positive evidence** that the file is obsolete.

Lack of evidence of usage is **not** evidence that deletion is safe.

Examples of insufficient evidence:
* "I didn't find any imports" (may have missed dynamic imports)
* "It looks like a duplicate" (structure similarity ≠ duplication)
* "It hasn't been edited in 6 months" (old code is still code)
* "No one complained about it" (absence of complaints ≠ absence of usage)

Examples of sufficient evidence:
* Verified canonical replacement exists with all functionality
* Static analysis + import grep confirms zero references
* Barrel files and package.json exports verified intact
* Tests all pass after deletion in CI
* All 8 criteria above are satisfied

---

## Deletion Checklist (Use This)

Before proposing any file deletion, complete this checklist:

```markdown
## File Deletion Proposal: `<file-path>`

### Criteria Check

- [ ] 1. Canonical implementation exists and is SSOT
  Evidence: 
  
- [ ] 2. Not part of public API
  Verified by: 
  
- [ ] 3. No active imports
  Grep result: `git grep <pattern>` → (no matches)
  
- [ ] 4. No test dependencies
  Grep result: `git grep <pattern> -- "**/*.test.ts"` → (no matches)
  
- [ ] 5. Not configuration file
  File type: 
  
- [ ] 6. Not repository role (entry point, barrel, schema, etc)
  Current role: None identified
  
- [ ] 7. Canonical is functionally equivalent
  Verification: (description or diff link)
  
- [ ] 8. Ready for CI validation
  Status: Ready to push for CI
  
- [ ] 9. Classification
  Status: ☐ Approved ☐ Deferred ☐ Manual Review ☐ Blocked
  
- [ ] 10. Default rule applied
  Uncertainty addressed: Yes / No

### Verification Results

All checks passed: ☐ Yes ☐ No

If "No", do not proceed with deletion.
```

---

## Related Governance Principle

**Architecture migration is not architecture cleanup.**

Migrating ownership (moving responsibilities into better packages) and removing obsolete implementations are separate activities.

**Always:**
1. Perform the migration first (move code to new location)
2. Validate the migration (tests pass, imports updated)
3. Only then perform cleanup (remove old location as a separate, independent PR)

This keeps PRs small, auditable, and reduces the risk of accidental regressions.

---

## Examples

### ✅ Approved for Deletion

**File:** `shared/src/constants/locationEvents.ts`

**Evidence:**
- [x] Canonical exists: `packages/contracts/src/v1/common/constants/locationEvents.ts`
- [x] Not exported: `@esparex/shared/index.ts` re-exports from contracts, not directly
- [x] No imports: `git grep "from.*shared/src/constants/locationEvents"` → no matches
- [x] No tests: `git grep "locationEvents" -- "**/*.test.ts"` → constant used, not file imported
- [x] Not configuration: It's a constant file
- [x] Not special role: Just a constant definition
- [x] Equivalent: Canonical has identical content
- [x] CI validated: All tests pass after deletion

**Classification:** Approved for deletion

---

### ❌ Blocked from Deletion

**File:** `packages/contracts/src/v1/authentication/index.ts`

**Reason:**
- Exported by `packages/contracts/src/v1/index.ts`
- Part of @esparex/contracts public API
- Deleting breaks `export * from './authentication'`

**Classification:** Blocked (Public API)

---

### ⏳ Deferred

**File:** `core/src/validators/ad.validator.ts`

**Reason:**
- Currently used by backend/api tests
- Should be relocated to `@esparex/contracts/ad/validators/`
- Needs separate refactoring PR for relocation
- Only after relocation is successful can we delete the old location

**Action:** File separate "Relocate validators to contracts" PR

**Classification:** Deferred (Requires architectural refactoring first)

---

## Approval Authority

Files classified as **Approved** may be deleted:
* By automated cleanup (if verified by CI)
* By any contributor after code review
* Without additional approval

Files classified as **Deferred**, **Manual Review**, or **Blocked**:
* Require discussion in code review
* May require domain expert judgment
* Cannot be deleted until classification changes

---

## When to Use This Gate

Use this gate for:
* Duplicate file cleanup
* Legacy code removal
* Dead code elimination
* Obsolete file removal
* Repository refactoring

Do **not** use this gate for:
* File renames (use `git mv`)
* Test file cleanup (use test runner to detect unused)
* Auto-generated file removal (check generation tool instead)
* CI/build artifact removal (manage via .gitignore)

---

## Questions and Escalation

**Question:** What if a file passes all 8 criteria but I'm still uncertain?

**Answer:** Use criterion 10 — Default Rule. Preserve the file. Propose it for deletion in a separate discussion.

**Question:** What if the canonical implementation is incomplete?

**Answer:** Criterion 1 blocks deletion. Complete the canonical implementation first, validate it, then propose deletion in a separate PR.

**Question:** What if tests import the file but indirectly (via mock)?

**Answer:** Criterion 4 requires explicit verification. If unsure, ask in code review or preserve the file.

---

**Last Updated:** 2026-07-19  
**Status:** Active and Mandatory
