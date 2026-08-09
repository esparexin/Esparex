# Repository Governance Manual (`REPOSITORY-GOVERNANCE.md`)

> **Status:** Enforced · **Owner:** Engineering Governance · Strong reference: Vol-2 §28, Vol-4 §42

---

## 1. Folder structure (authoritative)

```
apps/            web · admin · mobile
backend/api/     Express API (routes → controllers → core)
core/            domains (DDD) · validators · services (legacy shim — Wave 2)
packages/        contracts · ui · mobile-ui · shared · design-tokens · kernel
docs/            architecture · governance · audits · releases · performance
tooling/         architecture checks · guards
.governance/     automated evidence & gate outputs (CI-generated)
audit-reports/   audit volumes + baselines (evidence store)
```

Rules: no app-local `types/` or `schemas/` (goes to contracts); no per-app UI primitive trees (SSOT); feature folders inside app as `features/*`.

## 2. Branch strategy

| Branch | Purpose | Protection |
| --- | --- | --- |
| `main` | production (tagged) | protected — merging via PR + CI+gate |
| `develop` (optional) | integration | CI gate |
| `feat/<issue>-<slug>` / `fix/<slug>` / `chore/<slug>` | work | — reverted at will |
| `archive/*` | dead experiment barn | read-only |
| release tags | `vMAJOR.MINOR.PATCH` (+`-rc.N`) | — |

Gate: `repo:branch-protection` (BRANCH-001 must pass — currently failing, cleanup tracked Vol-3 §39).

## 3. Git practices

- **Commits:** Conventional Commits `type(scope): subject` (`feat`, `fix`, `chore`, `refactor`, `security`, `docs`, `test`); one logical change per commit; issue ref if tracked.
- **Merges:** squash merge per PR; no direct pushes to main.
- **Pr:** description must include Change Impact Analysis block (Manual §12) for core/contracts/platform PRs.
- **Labels:** `feature|fix|refactor|chore|security|dependency|wave-N` mandatory ≥ 1.
- **Milestones:** wave milestones (Wave 0–5 from Remediation Program) + sprint-rolling.
- **Review:** CODEOWNERS required (response ≤48h); no silent merges without approved review.
- **Hooks:** husky + pre-commit lint (`lint:changed`) — guard quality at source.

## 3. CODEOWNERS responsibilities

- Every top-level dir has exactly one owner group (7 groups today).
- Adding files outside your group’s path = review required from that group.
- Doctrine: owner keeps their surface free of `knip`/`jscpd`/suppression drift.

## 4. Hygiene standards

- No checked-in `dist/`, `*.tsbuildinfo`, coverage or CI artifacts (one historical exception tracked: `design-tokens/dist` — Wave 5 cleanup).
- `.env*` never committed; secrets only via env providers (Render sync:false).
- Lockfile must be committed and updated atomically (`repo:lockfile`).
- Dead/abandoned artifacts flagged via `guard:knip` weekly.

## 5. Lifecycle of branches & tags

- Feature branch → PR → squash → delete source branch.
- Tag creation at `release.md` sign-off only; chronicler updates.

---

*Standard refs: ENTERPRISE-AUDIT-MANUAL §17, .github/PULL_REQUEST_TEMPLATE.md, .github/CODEOWNERS.*