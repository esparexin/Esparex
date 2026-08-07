# Sprint 2 Retrospective — Design Tokens

**Sprint**: Sprint 2  
**Objective**: Establish `@esparex/design-tokens` as the platform SSOT and migrate all color literals in `apps/mobile`.  
**Status**: ✅ Complete (Visual QA pending on PR 3 & PR 4)

---

## What Was Accomplished

### Infrastructure (PR 1 – PR 4)
- Created `packages/design-tokens` with primitive and semantic layers
- Wired Web app via CSS variables + Tailwind
- Wired React Native via NativeWind + `StyleSheet` import pattern
- Established token consumption patterns for both platforms

### Migration (PR 5 – PR 6)
- Eliminated **114 `no-color-literals` violations** across 13 files
- Eliminated **4 `no-inline-styles` violations** in user profile screens
- Documented every exception with root cause before suppressing
- Total error baseline reduced from 114 → 34

### Token Completion (PR 7)
- Added 11 new semantic tokens (`success-subtle`, `warning-subtle`, `info-subtle`, `overlay`, `inverse-surface` variants, etc.)
- Discovered that the exception registry contained incorrect assumptions — 5 token categories were already present in the system
- Added `base.action` as a documented primitive pending ADR

### Documentation (PR 8)
- Token catalog: authoritative reference for designers and developers
- Exception registry rewritten with Root Cause + Resolution columns
- Inline style audit: all 15 remaining violations classified and owned
- Package README with install and usage patterns
- API frozen — extensions require ADR

---

## What the Governance Model Prevented

| Risk | How It Was Caught |
|------|-------------------|
| Duplicate token additions | Inspecting `colors.ts` before writing new tokens |
| Incorrect root cause in exception registry | Verifying literals against actual token values |
| Scope creep into business logic | Explicit PR scope definition reviewed before implementation |
| Premature semantic promotion of `action` color | ADR gate enforced before adding to `semantic.*` |
| Inline styles misclassified as exceptions | Per-violation audit with line-level context review |

---

## Key Findings

### Finding 1: Exception registries can contain incorrect assumptions

Five exception categories (`success`, `warning`, `info`, `primary`, `destructive-foreground`) were documented as missing — but they already existed in the token system since PR 2. The registry was wrong.

**Lesson**: Verify against the actual source before recording an assumption. Read the file first, then document.

### Finding 2: Naming should describe intent, not implementation

`blue-action` was renamed to `action` before being committed. The color is `#2563eb` today. Tomorrow it might be `#0ea5e9`. The intent — interactive control — will not change.

**Rule**: Semantic token names describe what something **is for**, not what it **looks like**.

### Finding 3: Two similar colors are not the same design decision

`semantic.light.primary` (`#0284c7`) and `base.action` (`#2563eb`) appear close but represent fundamentally different decisions:
- `primary` = brand identity
- `action` = interactive affordance

Merging them silently would have been a design regression. An ADR is the correct gate.

---

## Metrics

| Metric | Before Sprint 2 | After Sprint 2 |
|--------|----------------|----------------|
| `react-native/no-color-literals` | 114 | 0 |
| `react-native/no-inline-styles` (scope) | 4 | 0 |
| Documented exceptions | 0 | 11 (active) + 3 (permanent) |
| Token catalog | None | ✅ |
| Token package README | None | ✅ |
| Type errors | 0 | 0 |
| Test pass rate | 151/151 | 151/151 |

---

## Carried Forward to Sprint 3

| Item | Why Deferred | Owner |
|------|-------------|-------|
| `base.action` ADR | Design language decision requiring product/design input | Architecture |
| 13 token resolutions | Blocked by ADR | Platform |
| 15 inline style migrations | Chat + Listings + PostAd — outside Sprint 2 scope | Platform |
| Visual QA (PR 3 & PR 4) | Requires device testing | QA |
| Dark mode audit | Low priority, no regressions observed | Platform |

---

## Sprint 2 Sequence

```
PR 1  Initialize @esparex/design-tokens
  ↓
PR 2  Extract canonical token API
  ↓
PR 3  Connect Web (Tailwind + CSS variables)
  ↓
PR 4  Connect React Native (NativeWind + StyleSheet)
  ↓
PR 5  Migrate 114 color literals → 0
  ↓
PR 6  Migrate 4 inline styles → 0
  ↓
      Inline Style Audit (15 remaining classified)
  ↓
PR 7  Extend token system (missing variants + overlay + inverse)
  ↓
PR 8  Document, freeze API, write catalog
```
