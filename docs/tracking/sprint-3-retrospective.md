# Sprint 3 Retrospective

## What Went Well (Keep Doing)

1. **Evidence-Driven Execution Prompts**: Every PR required pre-change audits, post-change verification, and explicit entry in `engineering-action-register.md` (EA-019 through EA-025). This prevented silent regressions or unverified claims.
2. **ADR Governance Gate**: Isolating the 9 `#2563eb` action color suppressions behind ADR-D004 ensured design system consensus before code modifications. Promoting `action` to semantic tokens kept brand sky blue (`#0284c7`) distinct from interactive control blue (`#2563eb`).
3. **Structured PR Partitioning**: Separating independent token cleanup (PR 1), inline style migrations (PR 2, PR 3), and ADR resolution (PR 4) kept changes reviewable and pull-request sized per monorepo rules.
4. **Node 26 Compatibility Hardening**: Proactively testing Metro production bundling under Node 26 surfaced package export interop gaps early, leaving the monorepo build robust for modern Node toolchains.

---

## What Could Be Improved (Adjustments)

1. **Strict CJS/ESM Subpath Exports in Metro**: Modern Node versions (v22+/v26) strictly enforce `package.json` export mappings. Metro dependencies require explicit `./src/*` entry points in local workspace patches.
2. **Jest Test Concurrency**: Running 44 mobile test suites concurrently under resource-heavy commands can occasionally hit default 5000ms timeouts on `providers.spec.tsx`. Isolating test runs or configuring `--maxWorkers=50%` stabilizes CI test execution.

---

## Key Takeaways & Lessons Learned

- **Rule**: Never suppress linter rules when semantic design tokens or component abstraction patterns already exist.
- **Rule**: Always decouple design decisions (ADRs) from mechanical code migrations.
- **Rule**: Verify production exports (`npx expo export`) as part of release gates, not just `tsc` type-checks.
