# Esparex Cleanup Rollback Action Plan

This document outlines recovery checklists, git restore commands, and backup targets to recover files if cleanup fails.

---

## 1. Tag Backup Recommendation
Create a tag before running any deletion scripts:
```bash
git tag -a pre-cleanup-2026-07-03_02-41-02 -m "Pre-cleanup backup tag"
git push origin pre-cleanup-2026-07-03_02-41-02
```

---

## 2. Git Restore Commands
To restore all files in this cleanup phase, execute:
```bash
# Restore specific deleted files
git checkout pre-cleanup-2026-07-03_02-41-02 -- "C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/ui/CompletedFieldCard.tsx"
git checkout pre-cleanup-2026-07-03_02-41-02 -- "C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/user/profile/tabs/MyAdsTab.tsx"
git checkout pre-cleanup-2026-07-03_02-41-02 -- "C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/user/wizard/WizardModalShell.tsx"
git checkout pre-cleanup-2026-07-03_02-41-02 -- "C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/middleware/duplicateCooldownMiddleware.ts"
git checkout pre-cleanup-2026-07-03_02-41-02 -- "C:/Users/Administrator/Documents/GitHub/Esparex/core/src/services/AdMediaService.ts"
git checkout pre-cleanup-2026-07-03_02-41-02 -- "C:/Users/Administrator/Documents/GitHub/Esparex/shared/src/geo/geo.types.ts"
```

Alternatively, to completely reset your local workspace back to the backup state:
```bash
git reset --hard pre-cleanup-2026-07-03_02-41-02
```

---

## 3. Recovery Checklist
- [ ] Confirm git branch is clean before running cleanup.
- [ ] Run `git tag` to verify tag creation success.
- [ ] Execute deletion phase script.
- [ ] In case of validation errors, immediately execute `git checkout pre-cleanup-2026-07-03_02-41-02 -- <failed-file>`.
- [ ] Re-run `npm run build` to verify restore success.

---

## 4. Affected File Inventory (6 files)
- C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/ui/CompletedFieldCard.tsx
- C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/user/profile/tabs/MyAdsTab.tsx
- C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/user/wizard/WizardModalShell.tsx
- C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/middleware/duplicateCooldownMiddleware.ts
- C:/Users/Administrator/Documents/GitHub/Esparex/core/src/services/AdMediaService.ts
- C:/Users/Administrator/Documents/GitHub/Esparex/shared/src/geo/geo.types.ts
