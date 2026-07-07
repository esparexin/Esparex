# Phase 4 — Governance Automation Backlog

Deferred items that require Phase 4 tooling infrastructure to implement.
Items here cannot be actioned during Phase 3 (documentation-only) without
violating the One Task Rule.

---

## Registry

| ID | Title | Priority | Source | Status |
|---|---|---|---|---|
| P4-001 | `pnpm governance:branch-cleanup` script | high | User recommendation, post-PR-#510 | Open |

---

## Detail

### P4-001 — `pnpm governance:branch-cleanup <branch-name>`

**Priority:** High  
**Source:** Recommendation made after PR #510 cleanup (2026-07-06)  
**Status:** Open  
**Target Phase:** 4

**Description:**  
Automate RULE-GIT-001 as a repository script that performs the entire branch
cleanup protocol and emits a structured pass/fail report.

**Required steps (per RULE-GIT-001):**
1. Verify clean working tree (`git status --short` → must be empty).
2. Checkout and pull `develop`.
3. Check ancestor reachability (`git merge-base --is-ancestor <branch> develop`).
4. If not ancestor → tree equivalence check (`git diff develop <branch>` → must be empty).
5. Optional patch equivalence (`git cherry develop <branch>` → all `-` prefixes).
6. Delete local branch (`git branch -D <branch>` after verification).
7. Delete remote branch if still present (`git push origin --delete <branch>`).
8. Prune remote tracking refs (`git fetch --prune`).
9. Final verification (`git status`, `git branch`, `git branch -r`).
10. Emit structured pass/fail report to stdout and optionally to `reports/governance/`.

**Design notes:**
- Script lives at `scripts/governance/branch-cleanup.ts` (consistent with existing governance scripts).
- Output format should match the existing governance report JSON schema so Phase 4 can aggregate it.
- Dry-run mode (`--dry-run`) should be supported to preview actions without executing deletions.
- The script should refuse to run if working tree is dirty (RULE-GIT-002 enforcement).

**Dependencies:**
- Phase 4 governance report infrastructure (structured JSON output, session history).
- No GitHub API integration required for MVP; can be added as an enhancement.
