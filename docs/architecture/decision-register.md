# Architecture Decision Register

The permanent record of every architectural decision made across the Esparex platform.

**Format**: `D-{sequential-number}` — never delete entries. Superseded decisions are marked `Status: Superseded by D-NNN`.

Companion to the [Engineering Action Register](../tracking/engineering-action-register.md):
- **Decision Register** = *Why did we decide this?*
- **Engineering Action Register** = *What did we implement because of that decision?*

---

## Decision Table

| ID | Decision | Sprint | ADR | Status |
|----|----------|--------|-----|--------|
| D-001 | `packages/design-tokens` is the platform SSOT | Sprint 2 | ADR-001 (inline) | ✅ Approved |
| D-002 | Two-layer token architecture: `base.*` → `semantic.*` | Sprint 2 | ADR-001 (inline) | ✅ Approved |
| D-003 | Token API frozen after Sprint 2; extensions require ADR | Sprint 2 | — | ✅ Approved |
| D-004 | `semantic.light.action` = `#2563eb` promoted for interactive controls | Sprint 3 | ADR-004 | ✅ Approved |
| D-005 | StyleSheet preferred for static layout; className for NativeWind dynamic styling | Sprint 2 | — | ✅ Approved |
| D-006 | Document every exception before suppressing; no silent eslint-disable | Sprint 2 | — | ✅ Approved |
| D-007 | Inline styles: static values migrate to StyleSheet; dynamic/runtime values are permanent exceptions | Sprint 2 | — | ✅ Approved |
| D-008 | Semantic token names describe intent, not implementation | Sprint 2 | — | ✅ Approved |
| D-009 | Category hierarchy depth capped at 3 levels (`treeDepth: 0 \| 1 \| 2`) | Sprint 3 | ADR-005 | ⏳ Proposed |

---

## Decision Details

---

### D-001

**Decision**  
`packages/design-tokens` is the single source of truth for all design tokens across the Esparex platform (Web, React Native, future platforms).

**Reason**  
Before Sprint 2, color, spacing, and typography values existed in three unconnected locations:
- `apps/web/src/app/globals.css` (CSS variables)
- `apps/mobile/tailwind.config.js` (NativeWind theme)
- Hardcoded hex literals in 13+ component StyleSheets

Any color change required editing multiple files with no guarantee of consistency.

**Alternatives Considered**
- Option A: Keep per-platform token files, enforce naming convention. Rejected — still duplicates values.
- Option B: Use a third-party token management tool. Rejected — adds an external dependency without platform-specific benefit.
- **Option C (chosen)**: Shared TypeScript package, consumed natively by each platform. Zero runtime cost; type-safe; platform-agnostic.

**Consequences**
- All platforms must import from `@esparex/design-tokens`
- Token extensions require modifying one file instead of three
- Breaking changes to the token API affect all consuming platforms simultaneously

**Engineering Actions**: EA-001, EA-002, EA-003, EA-004

**Status**: ✅ Approved (Sprint 2)

---

### D-002

**Decision**  
Two-layer token architecture: `base.*` (primitive palette) → `semantic.*` (intent-mapped values). Application code must only reference `semantic.*`.

**Reason**  
Primitive tokens (`base.slate[500]`) express raw values with no semantic meaning. Using them directly in components creates the same maintainability problem as hex literals — if the brand changes, every component must be updated individually.

Semantic tokens (`semantic.light['muted-foreground']`) express intent. When the brand changes, only `colors.ts` changes — all consumers update automatically.

**Rule**  
```
✅  semantic.light.primary          → AppButton background
❌  base.brand[600]                 → AppButton background
❌  #0284c7                         → AppButton background
```

**Engineering Actions**: EA-002

**Status**: ✅ Approved (Sprint 2)

---

### D-003

**Decision**  
The `semantic.*` token API is frozen after Sprint 2. Adding, renaming, or removing semantic tokens requires an Architecture Decision Record.

**Reason**  
Both `apps/web` and `apps/mobile` now depend on `semantic.*` token names. Uncontrolled additions create unbounded API surface. Renames without ADR would be silent breaking changes for any consumer not caught by TypeScript.

**Exception process**
1. Identify missing token (document in `token-exceptions.md`)
2. Open issue with `missing-token` label
3. Write ADR if the addition is foundational (new color intent category)
4. Add to `base.*` first (primitive only)
5. Promote to `semantic.*` after ADR approval
6. Update `docs/design-system/token-catalog.md`

**Engineering Actions**: EA-018

**Status**: ✅ Approved (Sprint 2)

---

### D-004

**Decision**  
Promoted `base.action` (`#2563eb`) to `semantic.light.action` (and `base.brand[500]` `#0ea5e9` to `semantic.dark.action`) per ADR-004 Option A.

**Reason**  
9 exception suppressions across the mobile app use `#2563eb` as an interactive control color (buttons, prices, links). The current `semantic.light.primary` = `#0284c7` (sky-600 — the Esparex brand blue). These are not the same design decision:

| Token | Value | Intent |
|-------|-------|--------|
| `semantic.light.primary` | `#0284c7` | Brand identity |
| `semantic.light.action` | `#2563eb` | Interactive affordance |

Option A separates brand identity from interactive control affordance without visual regressions.

**Engineering Actions**: EA-012, EA-013, EA-023, EA-024

**Status**: ✅ Approved (Sprint 3 — ADR-004)

---

### D-005

**Decision**  
In `apps/mobile`, prefer NativeWind `className` for static styling. Use `StyleSheet.create` with canonical token references where platform abstractions require it (e.g. `contentContainerStyle`, `StyleProp<ViewStyle>` props).

**Reason**  
NativeWind `className` is more readable and consistent with the web codebase. However, certain React Native APIs only accept `StyleProp<ViewStyle>` (e.g. `ScrollView.contentContainerStyle`, `AppButton.style`). For these, `StyleSheet.create` is the appropriate tool with canonical semantic tokens as values.

**Rule**  
```
✅  className="bg-background text-foreground"   (static, NativeWind)
✅  StyleSheet.create({ bg: semantic.light.background })  (StyleProp props)
❌  style={{ backgroundColor: '#ffffff' }}       (inline hex)
❌  style={{ flex: 1 }}                          (inline static value — use StyleSheet)
```

**Engineering Actions**: EA-008

**Status**: ✅ Approved (Sprint 2)

---

### D-006

**Decision**  
Every `eslint-disable-next-line` suppression must be documented in the exception registry (`token-exceptions.md`) with: the literal suppressed, the root cause, and the resolution path. Silent suppressions are prohibited.

**Reason**  
Without documentation, suppressions become invisible technical debt. A future engineer reading `// eslint-disable-next-line react-native/no-color-literals` has no way to know if the suppression is:
- Waiting for a missing token (resolvable)
- A permanent exception (e.g. native prop)
- An architectural gap (requires ADR)

**Engineering Actions**: EA-007, EA-015

**Status**: ✅ Approved (Sprint 2)

---

### D-007

**Decision**  
Inline style classification: static layout values migrate to `StyleSheet`; dynamic/runtime/platform-API values are permanent exceptions.

**Migrate**  
- `flex: 1`, `flex: 2` (static ratio)
- `padding`, `paddingBottom` (static spacing)
- `gap`, `borderRadius` (static layout)
- Static `width`/`height`
- Alignment properties

**Permanent exceptions**  
- Animated interpolated values
- Runtime measurements (`useWindowDimensions`, gesture handlers)
- React Native native props that don't accept StyleSheet variables (`tintColor`, `colors` on RefreshControl, `color` on ActivityIndicator)
- Keyboard offset compensations
- Safe area inset values

**Engineering Actions**: EA-008, EA-009, EA-010

**Status**: ✅ Approved (Sprint 2)

---

### D-008

**Decision**  
Semantic token names describe **intent**, not **implementation**. Token names must remain valid if the underlying color value changes.

**Reason**  
`blue-action` leaks the current implementation (`#2563eb` = blue) into the public API. If the product team changes the action color to green, `blue-action` becomes incorrect and misleading without a breaking API change.

`action` describes what the token is *for* — interactive controls — regardless of what color it eventually resolves to.

**Rule**  
```
✅  base.action          (describes intent: interactive control)
✅  semantic.light.primary  (describes intent: brand primary)
✅  semantic.light['success-subtle']  (describes intent: success tinted surface)
❌  base['blue-action']   (describes implementation: blue color)
❌  base['slate-border']  (describes implementation: slate color)
❌  base['16px-padding']  (describes implementation: pixel value)
```

**Engineering Actions**: EA-013

**Status**: ✅ Approved (Sprint 2)

---

## Pending ADRs

| ID | Subject | Blocking | Owner |
|----|---------|----------|-------|
| ADR-D004 | `base.action` semantic promotion | D-004, 9 lint suppressions | Architecture + Design |

---

## ADR Template

When an ADR is required:

```markdown
# ADR-{N}: {Title}

**Date**: YYYY-MM-DD  
**Status**: Proposed / Accepted / Rejected / Superseded  
**Decision Reference**: D-{N}

## Context
What problem are we solving?

## Decision
What was decided?

## Alternatives Considered
| Option | Description | Reason Rejected |
|--------|-------------|----------------|

## Consequences
- What becomes easier?
- What becomes harder?
- What breaking changes occur?

## Verification
How will we know this was implemented correctly?

## Rollback
How do we revert this decision?
```

---

## ADR-N+1: Ad Duplicate Fingerprint Logic

*Previously documented as `docs/architecture/duplicate-fingerprint-logic.md`. Consolidated here per DOCUMENTATION-GOVERNANCE §7 anti-sprawl policy.*

**Status**: Implemented and in production.

### Context
The duplicate fingerprint prevents malicious or accidental submission of identical listings by the same seller. By detecting duplicates early in the orchestration layer, we prevent catalog pollution and short-circuit image processing and database writes.

### Decision: SHA-256 Fingerprint on 8 Normalized Fields

The fingerprint is constructed by concatenating the following normalized fields with `|` delimiters:

1. **type** — Listing type (`ad`, `spare_part`). Defaults to `ad`.
2. **sellerId** — ID of the seller.
3. **category** — Primary category ID.
4. **brand** — Brand ID, otherwise `na`.
5. **model** — Model ID, otherwise `na`.
6. **condition** — Physical condition (`deviceCondition` for mobiles/tablets, `screenSize` for TVs, standard `condition`, otherwise `na`).
7. **priceRange** — 500-unit price bucket window (e.g., `1000-1499`).
8. **locationRadius** — `city:state:lng:lat` (coordinates rounded to 2 decimal places).

**Excluded Fields** (robust matching despite minor variations):
- Title, Description, Exact Price (bucketed instead), Exact Coordinates (rounded instead), Image URLs/Hashes (handled by cross-user risk assessment).

**Normalization**: All values pass through `normalizeToken()` — `.trim()`, `.toLowerCase()`, strip non-alphanumeric via `/[^\p{L}\p{N}]+/gu`.

**Hash**: SHA-256, first 16 hex chars:
```typescript
createHash('sha256').update(fingerprintBase).digest('hex').substring(0, 16);
```

