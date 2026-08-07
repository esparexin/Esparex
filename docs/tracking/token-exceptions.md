# Design Token Exceptions

This registry is the authoritative historical record of every color literal exception encountered during Sprint 2.
Each entry documents the root cause and its resolution — so future audits start from verified evidence, not assumptions.

---

## Exception History

| Exception | File(s) | Literal | Root Cause | Resolution |
|-----------|---------|---------|------------|------------|
| `success` / `success-foreground` | `BusinessStatusScreen`, `TransactionHistoryScreen` | `#16a34a` | **Token already existed** — `semantic.light.success` / `success-foreground` present since PR 2. Registry was wrong. | Registry corrected. Use `semantic.light['success-dark']` (newly added, more accurate shade). |
| `warning` / `warning-foreground` | `BusinessStatusScreen`, `TransactionHistoryScreen` | `#d97706` | **Token already existed** — `semantic.light.warning` / `warning-foreground` present since PR 2. Registry was wrong. | Registry corrected. Use `semantic.light['warning-dark']` (newly added, more accurate shade). |
| `info` / `info-foreground` | `StepDocumentsUpload`, `SmartAlertsScreen` | `#1d4ed8`, `#0284c7` | **Token already existed** — `semantic.light.info` present since PR 2. Registry was wrong. | Registry corrected. Use `semantic.light['info-dark']` / `semantic.light.info`. |
| `primary` | Multiple button/price labels | `#2563eb` | **Design language mismatch** — `semantic.light.primary` = brand sky (`#0284c7`). `#2563eb` is Tailwind blue-600, a different hue used for action controls. | `base.action` = `#2563eb` added as a documented primitive. ADR required before semantic promotion. See Open ADR below. |
| `destructive` / `destructive-foreground` | `BusinessStatusScreen`, `SmartAlertsScreen` | `#dc2626` | **Token already existed** — `semantic.light.destructive` / `destructive-foreground` present since PR 2. Registry was wrong. | Registry corrected. Use `semantic.light['destructive-dark']` (newly added). |
| `success-subtle` | `StepDocumentsUpload` uploadedButton | `#dcfce7` | **Genuinely missing** — subtle/tinted variant not in token system. | `semantic.light['success-subtle']` = `#dcfce7` added in PR 7. Resolvable in Sprint 3. |
| `warning-subtle` | (future use) | `#fef3c7` | **Genuinely missing** — subtle variant not in token system. | `semantic.light['warning-subtle']` = `#fef3c7` added in PR 7. |
| `info-subtle` | `StepDocumentsUpload` loadingBanner | `#eff6ff` | **Genuinely missing** — subtle variant not in token system. | `semantic.light['info-subtle']` = `#eff6ff` added in PR 7. Resolvable in Sprint 3. |
| `overlay` | `CreateSmartAlertModal` | `rgba(15, 23, 42, 0.6)` | **Genuinely missing** — scrim/overlay not in token system. | `semantic.light.overlay` = `rgba(15, 23, 42, 0.6)` added in PR 7. Resolvable in Sprint 3. |
| `inverse-surface` | `PlanSelectionScreen` walletCard | `#1e293b` | **Genuinely missing** — dark surface in light mode context not in token system. | `semantic.light['inverse-surface']` = `#1e293b` added in PR 7. Resolvable in Sprint 3. |
| `inverse-muted` / `inverse-subtle` | `PlanSelectionScreen` walletTitle/Label | `#94a3b8`, `#cbd5e1` | **Genuinely missing** — inverse text hierarchy not in token system. | `semantic.light['inverse-muted']` / `['inverse-subtle']` added in PR 7. Resolvable in Sprint 3. |

---

## Resolved ADR-004: Action Color vs Brand Primary

**Status**: ✅ Resolved (Sprint 3 — ADR-004 Option A)

**Resolution**:
`base.action` (`#2563eb`) was promoted to `semantic.light.action` per ADR-004 Option A.

All 9 suppressed `#2563eb` literals were replaced with `semantic.light.action`:
- `BusinessStatusScreen.tsx` — editButton (`semantic.light.action`)
- `StepDocumentsUpload.tsx` — uploadButton (`semantic.light.action`)
- `PlanSelectionScreen.tsx` — planPrice, buyButton (`semantic.light.action`)
- `TransactionHistoryScreen.tsx` — amount (`semantic.light.action`)
- `SmartAlertsScreen.tsx` — addButton, createButton (`semantic.light.action`)
- `CreateSmartAlertModal.tsx` — submitButton (`semantic.light.action`)
- `BusinessRegistrationWizardScreen.tsx` — nextButton (`semantic.light.action`)
- `SavedAdsScreen.tsx` — exploreButton (`semantic.light.action`)

---

## Resolved in Sprint 3 PR 1 (13 exceptions)

These suppressions were successfully replaced with semantic tokens introduced in Sprint 2 PR 7:

| File | Property | Token Used | Status |
|------|----------|------------|--------|
| `BusinessStatusScreen.tsx` | pendingCard / badgePending | `semantic.light['warning-dark']` | ✅ Resolved |
| `BusinessStatusScreen.tsx` | activeCard / badgeActive | `semantic.light['success-dark']` | ✅ Resolved |
| `BusinessStatusScreen.tsx` | rejectedCard / badgeRejected | `semantic.light['destructive-dark']` | ✅ Resolved |
| `StepDocumentsUpload.tsx` | loadingBanner | `semantic.light['info-subtle']` | ✅ Resolved |
| `StepDocumentsUpload.tsx` | loadingText | `semantic.light['info-dark']` | ✅ Resolved |
| `StepDocumentsUpload.tsx` | uploadedButton / text | `semantic.light['success-subtle']` / `['success-dark']` | ✅ Resolved |
| `PlanSelectionScreen.tsx` | walletCard | `semantic.light['inverse-surface']` | ✅ Resolved |
| `PlanSelectionScreen.tsx` | walletTitle | `semantic.light['inverse-muted']` | ✅ Resolved |
| `PlanSelectionScreen.tsx` | walletLabel | `semantic.light['inverse-subtle']` | ✅ Resolved |
| `TransactionHistoryScreen.tsx` | statusSuccess | `semantic.light['success-dark']` | ✅ Resolved |
| `TransactionHistoryScreen.tsx` | statusPending | `semantic.light['warning-dark']` | ✅ Resolved |
| `SmartAlertsScreen.tsx` | deleteText / frequencyText | `semantic.light['destructive-dark']` / `primary` | ✅ Resolved |
| `CreateSmartAlertModal.tsx` | overlay | `semantic.light.overlay` | ✅ Resolved |

---

## Permanent Exceptions

| File | Property | Reason |
|------|----------|--------|
| `ActivityIndicator color` prop | All screens | React Native native prop — does not accept StyleSheet variables |
| `RefreshControl colors` / `tintColor` | `SavedAdsScreen` | React Native native prop — does not accept StyleSheet variables |
| `ImageCarousel.tsx` — `style.width` | `ImageCarousel` | Runtime dynamic measurement — genuinely cannot be a StyleSheet constant |
