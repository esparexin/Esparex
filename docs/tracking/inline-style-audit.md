# Remaining Inline Style Audit

**Generated**: 2026-08-06  
**Baseline**: 15 `react-native/no-inline-styles` violations across 12 files  
**Purpose**: Classify each remaining violation before PR 7 (Token Extension) to determine disposition.

---

## Classification Key

| Category | Description | Action |
|----------|-------------|--------|
| **Migrate** | Static layout value with no runtime dependency | Move to `StyleSheet` in PR 7 |
| **Exception** | Dynamic value, platform-specific, or inherently inline | Suppress with `eslint-disable-next-line` + document reason |
| **Deferred** | Static value but outside current sprint scope | Sprint 3 |

---

## Violation Table

| # | File | Line | Inline Style | Category | Reason | Decision |
|---|------|------|-------------|----------|--------|----------|
| # | File | Line | Inline Style | Category | Reason | Status |
|---|------|------|-------------|----------|--------|--------|
| 1 | `ChatThreadScreen.tsx` | 116 | `{ flex: 1 }` on `KeyboardAvoidingView` | **Migrated** | Extracted to `styles.kavContainer` in `StyleSheet.create` (Sprint 3 PR 3). | ✅ Migrated |
| 2 | `ChatThreadScreen.tsx` | 125 | `{ padding: 16, paddingBottom: 20 }` on `FlatList` contentContainerStyle | **Migrated** | Extracted to `styles.scrollContent` in `StyleSheet.create` (Sprint 3 PR 2). | ✅ Migrated |
| 3 | `ConversationListScreen.tsx` | 43 | `{ width: 48, height: 48, borderRadius: 8 }` on thumbnail `Image` | **Migrated** | Extracted to `styles.thumbnail` in `StyleSheet.create` (Sprint 3 PR 2). | ✅ Migrated |
| 4 | `FilterBar.tsx` | 31 | `{ alignItems: 'center', gap: 8 }` on horizontal `ScrollView` contentContainerStyle | **Migrated** | Extracted to `styles.scrollContent` in `StyleSheet.create` (Sprint 3 PR 2). | ✅ Migrated |
| 5 | `FilterModal.tsx` | 183 | `{ flex: 1 }` on Reset `AppButton` | **Migrated** | Extracted to `styles.resetBtn` in `StyleSheet.create` (Sprint 3 PR 2). | ✅ Migrated |
| 6 | `FilterModal.tsx` | 186 | `{ flex: 2 }` on Apply `AppButton` | **Migrated** | Extracted to `styles.applyBtn` in `StyleSheet.create` (Sprint 3 PR 2). | ✅ Migrated |
| 7 | `ImageCarousel.tsx` | 43 | `{ width, height: '100%' }` on `Image` | **Exception** | `width` is a **runtime measurement** from `useWindowDimensions()`. Cannot be moved to `StyleSheet`. | Permanent exception |
| 8 | `MarketplaceScreen.tsx` | 110 | `{ padding: 16, paddingBottom: 100 }` on `FlatList` contentContainerStyle | **Migrated** | Extracted to `styles.scrollContent` in `StyleSheet.create` (Sprint 3 PR 2). | ✅ Migrated |
| 9 | `MyListingsScreen.tsx` | 73 | `{ gap: 8 }` on horizontal `ScrollView` contentContainerStyle | **Migrated** | Extracted to `styles.tabsContent` in `StyleSheet.create` (Sprint 3 PR 2). | ✅ Migrated |
| 10 | `MyListingsScreen.tsx` | 111 | `{ padding: 16, paddingBottom: 100 }` on `FlatList` contentContainerStyle | **Migrated** | Extracted to `styles.listContent` in `StyleSheet.create` (Sprint 3 PR 2). | ✅ Migrated |
| 11 | `SearchScreen.tsx` | 82 | `{ padding: 16, paddingBottom: 100 }` on `FlatList` contentContainerStyle | **Migrated** | Extracted to `styles.scrollContent` in `StyleSheet.create` (Sprint 3 PR 2). | ✅ Migrated |
| 12 | `StepCategory.tsx` | 38 | `{ padding: 16 }` on `ScrollView` contentContainerStyle | **Migrated** | Extracted to `styles.scrollContent` in `StyleSheet.create` (Sprint 3 PR 2). | ✅ Migrated |
| 13 | `StepDetails.tsx` | 32 | `{ padding: 16, paddingBottom: 32 }` on `ScrollView` contentContainerStyle | **Migrated** | Extracted to `styles.scrollContent` in `StyleSheet.create` (Sprint 3 PR 2). | ✅ Migrated |
| 14 | `StepImages.tsx` | 66 | `{ padding: 16, paddingBottom: 32 }` on `ScrollView` contentContainerStyle | **Migrated** | Extracted to `styles.scrollContent` in `StyleSheet.create` (Sprint 3 PR 2). | ✅ Migrated |
| 15 | `StepPreview.tsx` | 26 | `{ padding: 16, paddingBottom: 32 }` on `ScrollView` contentContainerStyle | **Migrated** | Extracted to `styles.scrollContent` in `StyleSheet.create` (Sprint 3 PR 2). | ✅ Migrated |

---

## Summary

| Decision | Count | Status |
|----------|-------|--------|
| **Migrated (Sprint 3 PR 2 & PR 3)** | 14 | ✅ All migrated to `StyleSheet.create` |
| **Permanent Exception** | 1 | `ImageCarousel` (runtime `width` prop) |

---

## Permanent Exception Detail

### `ImageCarousel.tsx` — `{ width, height: '100%' }`

```tsx
// width is a runtime value, cannot be a StyleSheet constant
style={{ width, height: '100%' }}
```

**Root cause**: `width` comes from a prop or `useWindowDimensions()` — it is a dynamic measurement passed at render time. `StyleSheet.create()` requires static values at module initialization. This is a legitimate permanent exception per the PR 7 scope definition:

> "Dynamic measurements / Runtime calculations → Leave as exception"

**Action**: Suppress with `// eslint-disable-next-line react-native/no-inline-styles` and document here.

---

## PR Impact

| PR | Action |
|----|--------|
| **PR 7 (Token Extension)** | No impact — zero of the 15 violations require token additions |
| **Sprint 3** | Open one PR to migrate the 13 static violations across the 10 remaining files |
| **Permanent Registry** | Add `ImageCarousel.tsx` to permanent exception list |

---

## Files to Migrate in Sprint 3

Grouped by feature for efficient PR batching:

**Chat** (2 violations, 2 files):
- `ChatThreadScreen.tsx:125` — contentContainerStyle padding
- `ConversationListScreen.tsx:43` — thumbnail dimensions

**Listings** (7 violations, 4 files):
- `FilterBar.tsx:31` — contentContainerStyle alignment
- `FilterModal.tsx:183,186` — button flex ratios
- `MarketplaceScreen.tsx:110` — contentContainerStyle
- `MyListingsScreen.tsx:73,111` — gap + contentContainerStyle
- `SearchScreen.tsx:82` — contentContainerStyle

**PostAd Wizard** (4 violations, 4 files):
- `StepCategory.tsx:38`
- `StepDetails.tsx:32`
- `StepImages.tsx:66`
- `StepPreview.tsx:26`
