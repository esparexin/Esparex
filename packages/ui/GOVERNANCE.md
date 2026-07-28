# Esparex Design System Governance

This document establishes the single source of truth (SSOT) rules for `packages/ui`. Any UI primitive, molecule, or pattern intended for cross-application use must adhere to these standards before merging.

---

## 1. Component Lifecycle

Components progress through a strict lifecycle to ensure backwards compatibility:
- **Experimental**: Newly introduced. API contracts are volatile and subject to change without major version bumps. Used for testing in feature branches.
- **Stable**: The canonical production version. Breaking changes to props require an Architectural Decision Record (ADR) and a major version bump.
- **Deprecated**: Replaced by a newer version. Must be marked with the `@deprecated` JSDoc tag outlining the migration path. Must remain in the codebase until 100% of consumers are migrated.

## 2. The 7-Step Migration Pipeline

To introduce existing duplicated application components into `packages/ui`, you must follow the strict Canonical Pipeline:
1. **Audit**: Identify all duplicated instances across `apps/web`, `apps/admin`, etc.
2. **Choose Canonical**: Select the highest-quality implementation to serve as the baseline.
3. **Improve**: Refactor to meet Accessibility and Performance checklists.
4. **Move**: Relocate the component to the appropriate folder in `packages/ui`.
5. **Migrate**: Update all consumer imports across the monorepo.
6. **Verify**: Ensure Type-checks, tests, and manual UI reviews pass.
7. **Delete**: Erase all legacy duplicates from application folders.

## 3. Folder Structure & Naming

- **Naming Conventions**: Components must use strict semantic PascalCase naming (e.g., `<PrimaryButton>`, `<ActionMenu>`). Avoid generic wrapper names (`<CustomDiv>`).
- **Structure**:
  - `src/atoms/`: Indivisible UI primitives (Button, Input, Badge).
  - `src/molecules/`: Simple compositions of atoms (SearchInput, Card).
  - `src/organisms/`: Complex, stateful layouts (Header, DataTable).
  - `src/patterns/`: Reusable UX flows (Form wizards, ConfirmationDialogs).

## 4. Export & Versioning Policy

- **Barrel Exports**: All stable components must be exported from `src/index.ts`. Consumers should import from `@esparex/ui`, never from internal paths (`@esparex/ui/src/atoms/Button`).
- **Semantic Versioning**: Follow SemVer strictly. Adding a new optional prop is a MINOR change. Renaming or removing a prop is a MAJOR breaking change.
- **Design Token Ownership**: `packages/ui` owns all global CSS tokens (colors, spacing, breakpoints) via shared `tailwind.config.ts`. Apps must extend, not redefine, these tokens.

## 5. Checklists (Mandatory)

### Accessibility (A11y) Checklist
- [ ] Semantic HTML is used (e.g., `<button>` not `div onClick`).
- [ ] Meaningful `aria-labels` and `aria-describedby` provided for screen readers.
- [ ] Focus traps implemented for modals/drawers.
- [ ] Visible focus rings on all interactive elements.
- [ ] Color contrast meets WCAG 2.2 AA standards.

### Performance Checklist
- [ ] Component does not cause layout shifts (CLS) across breakpoints.
- [ ] Expensive calculations are memoized (`useMemo`, `useCallback`).
- [ ] Avoids unnecessary deep re-renders via correct context boundaries.

### PR Acceptance Checklist
- [ ] Target component meets the A11y and Performance checklists.
- [ ] No remaining `import` statements reference old duplicate locations.
- [ ] `npm run type-check` passes with zero errors.
- [ ] All automated tests pass.
- [ ] Storybook stories are added or updated (if applicable).
- [ ] Manual verification confirms rendering across Mobile and Desktop breakpoints.

---

## 6. Typography Architecture & Usage Matrix (SSOT)

All user-facing text across the Esparex platform must consume the canonical 8-level typography tokens (`TYPOGRAPHY_TOKENS`) or the shared `<Heading>` and `<Text>` primitives.

### Canonical Typography Usage Matrix

| UI Element / Semantic Role | Typography Token / Primitive | Default Font Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- |
| **Page Title (h1)** | `Heading` variant="h1" (30px) | `700` (Bold) | `1.25` | `-0.02em` (`tracking-tight`) |
| **Section Title (h2)** | `Heading` variant="h2" (24px) | `700` (Bold) | `1.3` | `-0.01em` (`tracking-tight`) |
| **Dialog / Modal Title** | `Heading` variant="h3" (20px) | `600` (Semibold) | `1.35` | `-0.01em` (`tracking-tight`) |
| **Card Title (h4)** | `Heading` variant="h4" (18px) | `600` (Semibold) | `1.4` | `0` (`tracking-normal`) |
| **Primary Body Copy** | `Text` variant="body" (14px) | `400` (Normal) | `1.55` | `0` (`tracking-normal`) |
| **Button Text** | `Text` variant="body" (14px) | `500` / `600` | `1.4` | `0` (`tracking-normal`) |
| **Secondary Copy / Table Cell**| `Text` variant="small" (13px) | `400` / `500` | `1.5` | `0` (`tracking-normal`) |
| **Table Header** | `Text` variant="small" (13px) | `600` (Semibold) | `1.4` | `0` (`tracking-normal`) |
| **Helper Text / Input Label** | `Text` variant="caption" (12px)| `500` (Medium) | `1.4` | `0` (`tracking-normal`) |
| **Status Badge (All-Caps)** | `Text` variant="caption" (12px)| `600` (Semibold) | `1.2` | `+0.05em` (`tracking-wider`) |

### Typography Rules:
1. **Sub-12px Minimum:** Text below 12px (`0.75rem`) is prohibited for standard UI elements to guarantee WCAG 2.2 AA readability. Exceptional 11px `tiny` copy is reserved strictly for legal micro-disclaimers.
2. **Tracking Rules:** `Display`/`H1`/`H2` use negative tracking (`-0.02em` / `tracking-tight`). Body/Small/Caption use `0` (`tracking-normal`). All-Caps Badges use `+0.05em` (`tracking-wider`). Arbitrary `tracking-[N]` utilities are forbidden.
3. **No Arbitrary Sizes:** Arbitrary `text-[Npx]` classes are forbidden. Components must consume tokenized classes (`text-h1`, `text-body`, `text-caption`, etc.) or `<Heading>` / `<Text>` primitives.

