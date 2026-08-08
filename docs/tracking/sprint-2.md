# Sprint 2: Design Tokens

- [x] PR 1: Initialize `packages/design-tokens` (Package setup)
- [x] PR 2: Move Tokens (Canonical API)
- [x] Architecture Review Checkpoint
- [x] PR 3: Connect Web (Tailwind, CSS variables)
- [ ] Visual Regression Checkpoint (PR 3 & PR 4 — pending manual QA)
- [x] PR 4: Connect React Native (NativeWind)
- [x] Baseline Lint Snapshot
- [x] PR 5: Color Tokens (all screens — 114 violations → 0)
- [x] PR 6: Inline Styles Cleanup (4 violations → 0 in scope)
- [x] Inline Style Audit (`docs/tracking/inline-style-audit.md`)
- [x] PR 7: Token Extension (missing tokens added; `base.action` ADR opened)
- [x] PR 8: Documentation & Freeze ← **COMPLETE**

---

## Sprint 2 Status

| PR | Description | Status |
|----|-------------|--------|
| PR 1 | Initialize package | ✅ |
| PR 2 | Canonical tokens | ✅ |
| PR 3 | Connect Web | ✅ (Visual QA pending) |
| PR 4 | Connect React Native | ✅ (Visual QA pending) |
| PR 5 | Color literal migration | ✅ |
| PR 6 | Inline styles cleanup | ✅ |
| — | Inline Style Audit | ✅ |
| PR 7 | Token extension | ✅ |
| PR 8 | Documentation & Freeze | ✅ |

**Sprint 2: COMPLETE** (pending Visual QA sign-off on PR 3 & PR 4)

---

## Lint Baseline Progression

| Checkpoint | Total Errors | `no-color-literals` | `no-inline-styles` |
|------------|-------------|--------------------|--------------------|
| Before Sprint 2 | 114 | 114 | 19 |
| After PR 5 | 51 | 0 | 19 |
| After PR 6 | 34 | 0 | 14 (1 suppressed as permanent) |
| After PR 7/8 | 34 | 0 | 14 (deferred to Sprint 3) |
| **Net reduction** | **−80** | **−114** | **−5** |

---

## Deliverables

| Artifact | Location | Status |
|----------|----------|--------|
| Token package | `packages/design-tokens/` | ✅ Frozen |
| Token catalog | `docs/design-system/token-catalog.md` | ✅ |
| Package README | `packages/design-tokens/README.md` | ✅ |
| Exception registry | `docs/tracking/token-exceptions.md` | ✅ |
| Inline style audit | `docs/tracking/inline-style-audit.md` | ✅ |
| Sprint retrospective | `docs/tracking/sprint-2-retrospective.md` | ✅ |

---

## Open Items Carried to Sprint 3

| Item | Priority | Description |
|------|----------|-------------|
| `base.action` ADR | **High** | Resolve `#2563eb` vs `#0284c7` brand primary divergence. 9 suppressions depend on this. |
| 13 token resolutions | Medium | Replace `eslint-disable` suppressions with new semantic tokens once ADR resolves |
| 13 inline style migrations | Medium | Chat, Listings, PostAd static inline values → `StyleSheet` |
| Visual QA sign-off | **High** | Manual smoke test of PR 3 (web) and PR 4 (mobile) |
| Dark mode audit | Low | Verify `semantic.dark.*` token rendering across all screens |

---

### PR 3: Connect Web [x]
* **Status**: ✅ Implementation complete. Visual QA pending.

### PR 4: Connect React Native [x]
* **Status**: ✅ Implementation complete. Visual QA pending.

### PR 5: Color Tokens [x]
* **Files migrated**: 13 | **Violations**: 114 → 0 | **Type-check**: ✅ | **Tests**: ✅ 44/44

### PR 6: Inline Styles Cleanup [x]
* **Files**: `EditProfileModal`, `ProfileScreen`, `SettingsScreen`
* **Violations resolved**: 4 | **Type-check**: ✅ | **Tests**: ✅ 44/44
* **Permanent exception**: `ImageCarousel.tsx` (runtime `width` prop)

### PR 7: Token Extension [x]
* **Key finding**: Most tokens already existed. Exception registry contained incorrect assumptions.
* **Tokens added**: `success-subtle/dark`, `warning-subtle/dark`, `info-subtle/dark`, `error-dark`, `inverse-surface/muted/subtle`, `overlay`, `action` (primitive)
* **Type-check**: ✅ | **Tests**: ✅ 44/44

### PR 8: Documentation & Freeze [x]
* `base.action` renamed from `blue-action` — semantic over implementation
* Token catalog created at `docs/design-system/token-catalog.md`
* Package README at `packages/design-tokens/README.md`
* Exception registry rewritten with Root Cause + Resolution columns
* Sprint retrospective written
* API frozen — extensions require ADR
