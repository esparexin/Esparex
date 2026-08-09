# UI/UX Governance Manual (`UI-UX-GOVERNANCE.md`)

> **Status:** Enforced · **Owner:** Design system lead (tokens) + accessibility owner · Supremacy: AGENTS.md Global Accessibility & Responsive Governance

---

## 1. Design tokens (single source)

- All values from `@esparex/design-tokens` (3-layer: primitive → semantic → component) — no magic hex/px in app code (0-suppression policy).
- Tokens documented in `packages/design-tokens` exports; consumed via CSS variables in web, runtime tokens in mobile-ui.
- **Gate:** `guard:typography-ssot` + lint `no-color-literals`/`no-inline-styles` (0 suppressions).

## 2. Typography · spacing · grid · colors

| Concern | Rule |
| --- | --- |
| Type scale | token scale (12–48px family), line-height tokens; no ad-hoc sizes |
| Spacing | 4px base scale; semantic spacing tokens; no magic offsets |
| Grid | 12-col grid (web), 4-col mobile; single PageContainer ownership (no nested containers) |
| Colors | semantic tokens (light/dark); contrast ≥ 4.5:1 body, ≥3:1 large |
| Radius/Shadow | token-defined, consistent |

## 3. Component system

- Primitives (Button, Input, Select, Dialog, Drawer, Table, Card, Badge, Toast…) exist **once** in `@esparex/ui` / `mobile-ui`; local duplicates = violation (AGENTS "Do Not Duplicate").
- Custom composites in `apps/*/components/user/shared` only when no primitive covers the need (New File Justification).
- Icons: token-based icon set; no vendor icon sprawl (popup/icon SSOT).
- Motion: 150–300ms transitions, reduced-motion honored (`prefers-reduced-motion`).

## 4. Responsive (single instance)

- **One component per screen** with `hidden md:flex`-style utilities (AGENTS Single-Instance Responsive).
- No `useIsMobile`/window-width branching for layout (only canvas math + backdrop dismissal).
- Drawers/sheets: `inert` + focus trap for hidden subtrees.

## 5. Accessibility (mandatory — WCAG 2.2 AA)

- Every PR touching UI completes the 10-part accessibility audit checklist (AGENTS).
- Semantic HTML first; ARIA only when needed; visible focus rings; logical tab order; no traps; Escape closes dialogs; focus returns to trigger.
- Forms: label association, `aria-invalid`, error announcements, focus to first invalid.
- Automated: axe-core in CI (pipeline check #14) + manual VoiceOver/NVDA checks per release.

## 6. Dark mode

- Token-driven (semantic.light / semantic.dark); no per-file conditional colors.
- Contrast verified for both modes on all screens (ADR-004 precedent: action color token).
- Runtime: system preference + manual toggle persisted.

## 7. Audit linkage

- UI evidence: Vol-1 §24, Vol-2 §21/22 (loading/error states matrix — State Matrix Governance), `page-scorecard.csv` baseline.

---

*Owner: design-system + a11y; gates: `guard:typography-ssot`, a11y CI job, visual-qa matrix (GATE-001).*