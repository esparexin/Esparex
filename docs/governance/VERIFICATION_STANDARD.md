# Repository Verification Standard

This document defines the evidence standards, verification gates, and reporting rules required for all repository modifications, automation tasks, and AI agent operations within the Esparex repository. 

It establishes an "Evidence First" workflow designed to prevent hallucination, assumption-based merging, and unverified assertions.

---

## 1. Evidence Standards

No operation is considered complete unless supported by objective, reproducible evidence.

**Acceptable Evidence:**
- Native Git command output (e.g., `git status`, `git log`, `git ls-remote`)
- GitHub CLI or API output
- CI/CD workflow logs (e.g., GitHub Actions success/failure logs)
- Test suite output (`jest`, `playwright`)
- Build system output (`npm run build`, `tsc`, `next build`)

**Unacceptable Evidence:**
- Implementation plans
- Assumed behavior based on script existence
- Simulated offline merges posing as GitHub Pull Requests without documentation

---

## 2. Verification Gates

Every unit of work must pass the following verification gates in sequential order before being declared complete. Failure at any gate requires an immediate halt.

1. **Local Verification:** Tests, builds, and linting must pass on the local environment.
2. **Repository Verification:** Working tree must be completely clean (`git status`).
3. **Commit Verification:** Commits must be present locally (`git log`) and adhere to the project's commit message format.
4. **Remote Verification:** Pushed branches and tags must exist on the remote origin (`git ls-remote`).
5. **CI/CD Verification:** Continuous Integration workflows must complete successfully on the remote repository.
6. **Integration Verification:** Pull Requests must be reviewed, approved, and formally merged into the designated integration branch (e.g., `main`).

---

## 3. Reporting Rules

All reporting (by human contributors or AI agents) must strictly differentiate between actual states and assumed states.

- **Verified:** Direct evidence confirms the outcome.
- **Unverified:** Action was taken, but confirmation is not yet available.
- **Blocked:** Action cannot proceed due to a failure or missing dependency.
- **Assumed/Expected:** Theoretical outcome (must not be presented as a fact).

### No Simulated Operations
Agents and automation tools must never simulate Git or GitHub operations (such as offline direct merges to protected branches) and report them as formal GitHub Pull Requests or GitHub Actions successes unless explicitly authorized and documented as an exception.

---

## 4. Git Workflow Rules

- **Branch Protection:** Direct commits to `main` are prohibited under standard workflow conditions. All changes must be made via a branch and a Pull Request.
- If a direct merge is executed due to tooling limitations, it must be explicitly reported as an offline merge, not a GitHub Pull Request merge.
- The repository state (`git`) is the **Single Source of Truth (SSOT)**. It takes absolute precedence over any documentation, assumption, or implementation plan.

---

## 5. Completion Criteria (The Final Checklist)

Before any Epic, Sprint, or major task is marked **Completed**, the following checklist must be satisfied in its entirety:

* [ ] Working tree is clean (`git status`)
* [ ] Expected commits exist (`git log`)
* [ ] Remote branches exist (`git ls-remote`)
* [ ] Required tags exist (`git ls-remote --tags`)
* [ ] CI passed (verified from GitHub or CI output)
* [ ] Required reviews completed (if PR workflow is required)
* [ ] Target branch contains expected commit
* [ ] No temporary test artifacts remain
* [ ] Documentation matches repository state

If **any** item is missing or unverified, the project status remains **In Progress**.
