# 03_ENUM_GOVERNANCE_ROLLOUT — Lifecycle Migration Plan

## Phase-1: Shared Enum Extraction & Initial Migration
The objective of Phase-1 is to safely extract all lifecycle status enums into a centralized Single Source of Truth (SSOT).

---

## 1. Shared Enum Extraction Strategy
Establish centralized directory: `shared/enums/`
- `adStatus.ts`
- `businessStatus.ts`
- `moderationStatus.ts`

**Pattern**:
```typescript
export const AD_STATUS = { ... } as const;
export type AdStatus = typeof AD_STATUS[keyof typeof AD_STATUS];
```

**Alias Mapping**:
- `approved` → `live`
- `inactive` → `deactivated`
- `published` → `live`

---

## 2. Controlled Refactor Order
1. Create shared enums.
2. Replace domain constants.
3. Update lifecycle controllers.
4. Update aggregation pipelines.
5. Refactor frontend filters.

---

## 3. Legacy Value Bridging
Introduce a temporary adapter layer (`normalizeStatus`) to map legacy strings to canonical states during the transition window. The bridge must be decommissioning only after 100% adoption.

---

## 4. Telemetry & Monitoring
- **Rejection Threshold**: Mutation rejection rate must remain < 0.5%.
- **Rollback Indicators**: Spikes in lifecycle guard rejections or analytics mismatches.

---

## 5. Phase-1 Completion Criteria
- Zero string literal status references in core domains.
- Centralized `shared/enums/` imports enforced across frontend and backend.
- Build passes across all services.
- Moderation statistics remain stable post-migration.
