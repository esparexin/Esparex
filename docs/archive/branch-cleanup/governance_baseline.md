# Repository Governance Baseline

**Effective Date:** June 16, 2026
**Applicability:** All Future Branch Cleanup Operations

This repository follows the **MAD Entertainment Repository Cleanup Governance Standard**.

---

## 1. Required Phases
Every repository branch pruning cycle must complete all 9 phases sequentially:

1. **Branch Audit:** Review branches, last activity dates, and divergence details.
2. **Asset Discovery:** Inspect candidate branches for unmerged or unique code/docs.
3. **Supersession Validation:** Verify if branch changes are fully integrated on the develop/integration branch.
4. **Preservation Review:** Identify documentation, design, email, or infrastructure assets requiring extraction.
5. **Recovery Verification:** Confirm files are successfully copied, verified, and accessible.
6. **Authorization Review:** Perform a final gatekeeper audit before executing deletions.
7. **Cleanup Execution:** Prune obsolete branches and tag archives.
8. **Remote State Verification:** Confirm deletions and tag updates are reflected in the live remote repository.
9. **Evidence Archival:** Store immutable remote Git snapshots.

---

## 2. Deletion Prerequisites
No branch may be deleted unless all of the following statuses are confirmed:

* **Recovery Status = PASS**
* **Authorization Status = APPROVED**
* **Remote Verification Status = VERIFIED**

---

## 3. Archive Tag Requirements
Permanent archive tags must be generated before deleting any branch containing:

* Historical branches
* PDF systems
* Email systems
* Documentation branches
* Operational runbooks
* Design system branches

---

## 4. Governance Record Retention
All compliance audits, validation reviews, execution records, and Git snapshots must be stored under:

`docs/archive/branch-cleanup/`
