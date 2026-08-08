## What does this PR do?
<!-- One paragraph max. Link to issue with: Closes #N -->


## Type of change
- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `chore` — refactor / cleanup / tooling
- [ ] `perf` — performance improvement
- [ ] `docs` — documentation only


## Packages affected
- [ ] `backend`
- [ ] `apps/web`
- [ ] `apps/admin`
- [ ] `apps/mobile`
- [ ] `shared` / `core` / `packages`


## Repository Impact Statement
<!-- Required for any PR that creates new files. Skip only for docs-only PRs. -->

**New files introduced:** _N_
**Existing files modified:** _N_
**Files deleted:** _N_

### New File Justification (required if New files > 0)
Repository discovery completed:
- [ ] Searched `packages/ui`, `packages/contracts`, `shared/`, `core/`
- [ ] No existing component, hook, service, or DTO covers this responsibility
- [ ] New file placed in the canonical owner package per AGENTS.md ownership matrix


## Quality Gate Checklist
- [ ] `npm run type-check` passes locally
- [ ] `npm run guard:knip` passes locally (no new unused files or dependencies)
- [ ] `npm run guard:dead-code` passes locally
- [ ] `npm test` passes (backend / core)
- [ ] No `.env` or secret values committed
- [ ] No new `as unknown as` casts without an explanatory comment
- [ ] No new `eslint-disable` suppressions without justification comment


## Accessibility (required for UI changes)
<!-- Skip with: N/A — no UI changes -->
- [ ] Keyboard navigation verified
- [ ] Focus order preserved
- [ ] ARIA attributes correct
- [ ] No accessibility regressions introduced
