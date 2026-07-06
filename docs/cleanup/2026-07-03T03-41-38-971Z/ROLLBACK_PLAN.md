# Esparex Cleanup Rollback Action Plan

This document outlines recovery checklists, git restore commands, and backup targets to recover files if cleanup fails.

---

## 1. Tag Backup Recommendation
Create a tag before running any deletion scripts:
```bash
git tag -a pre-cleanup-2026-07-03_03-41-38 -m "Pre-cleanup backup tag"
git push origin pre-cleanup-2026-07-03_03-41-38
```

---

## 2. Git Restore Commands
To restore all files in this cleanup phase, execute:
```bash
# Restore specific deleted files
```

Alternatively, to completely reset your local workspace back to the backup state:
```bash
git reset --hard pre-cleanup-2026-07-03_03-41-38
```

---

## 3. Recovery Checklist
- [ ] Confirm git branch is clean before running cleanup.
- [ ] Run `git tag` to verify tag creation success.
- [ ] Execute deletion phase script.
- [ ] In case of validation errors, immediately execute `git checkout pre-cleanup-2026-07-03_03-41-38 -- <failed-file>`.
- [ ] Re-run `npm run build` to verify restore success.

---

## 4. Affected File Inventory (0 files)
