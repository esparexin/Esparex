# Cleanup Implementation Plan

Phased deletion grouping compiled based on discovered workspaces.

---

## 1. Phased Deletion Steps

### Phase 1: Workspace `root` - Batch 1 (5 files)
- [ ] Delete `C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/ui/CompletedFieldCard.tsx`
- [ ] Delete `C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/user/profile/tabs/MyAdsTab.tsx`
- [ ] Delete `C:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/user/wizard/WizardModalShell.tsx`
- [ ] Delete `C:/Users/Administrator/Documents/GitHub/Esparex/backend/user/src/middleware/duplicateCooldownMiddleware.ts`
- [ ] Delete `C:/Users/Administrator/Documents/GitHub/Esparex/core/src/services/AdMediaService.ts`

### Phase 2: Workspace `root` - Batch 2 (1 files)
- [ ] Delete `C:/Users/Administrator/Documents/GitHub/Esparex/shared/src/geo/geo.types.ts`

---

## 2. Validation Steps (Recommended for Phase 3 Execution)
After each workspace deletion phase, execute:
```bash
npm run build
npm run test
npm run lint
npm run governance:guards
```
Stop immediately if any step fails.
