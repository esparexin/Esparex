---
id: design-system-governance
owner: "@esparex/frontend-leads"
type: governance
version: 1.0
created: 2026-07-24
status: active
review_frequency: semi-annual
---

# Design System Governance — Package Freeze

**Version**: 1.0
**Status**: Active
**Scope**: `@esparex/ui` and all consuming applications
**Context**: Issued upon completion of the Design System Migration program (Sprints 1–9).

---

## 1. Package Ownership

### `@esparex/contracts`

| Field   | Value |
| ------- | ----- |
| Owner   | `@esparex/platform-core` |
| Purpose | SSOT for Zod schemas, API DTOs, and request/response payload contracts shared across all HTTP and RPC boundaries. |
| Location | `packages/contracts/` |

**Rules:**
- All shared entity models must be defined here first.
- Any field that appears in a DTO response must be typed here.
- May not import from any other Esparex package.
- Changes to this package require a **Contract Impact Checklist** in the PR.

---

### `@esparex/ui`

| Field   | Value |
| ------- | ----- |
| Owner   | `@esparex/frontend-leads` |
| Purpose | Shared, domain-agnostic presentation layer: tokens, primitives, patterns, and layout shells. |
| Location | `packages/ui/` |

**Boundary — The UI package owns:**
- Design tokens (z-index, spacing, color)
- Presentational primitives (Button, Input, Dialog, Sheet, etc.)
- Generic layout shells (PageShell, Sidebar, HeaderShell)
- Generic data patterns (DataTable, StatusChip)

**Boundary — The UI package must NOT own:**
- Business rules or domain logic
- Routing, navigation, or URL concerns
- Authentication, authorization, or session state
- API calls or data fetching
- Application-specific UI workflows (wizards, multi-step forms)

**Allowed Imports:** `@esparex/shared`, `@esparex/contracts` (types only)
**Forbidden Imports:** `@esparex/core`, `@esparex/backend-api`, `@esparex/apps-web`, `@esparex/apps-admin`

---

### `apps/web`

| Field   | Value |
| ------- | ----- |
| Owner   | `@esparex/web-team` |
| Purpose | User-facing web portal — pages, user workflows, listings, chat, payments, profile management. |
| Location | `apps/web/` |

**Rules:**
- Consumes `@esparex/ui` for all generic presentation.
- Owns all application-specific workflows that orchestrate business logic.
- Routing, auth guards, and page-level data fetching remain here permanently.
- Must not re-implement any primitive already in `@esparex/ui`.

**Allowed Imports:** `@esparex/contracts`, `@esparex/shared`, `@esparex/ui`
**Forbidden Imports:** `@esparex/core`, `@esparex/backend-api`, `@esparex/apps-admin`

---

### `apps/admin`

| Field   | Value |
| ------- | ----- |
| Owner   | `@esparex/admin-team` |
| Purpose | Platform admin dashboard — moderation, user management, business oversight, system reporting. |
| Location | `apps/admin/` |

**Rules:**
- Consumes `@esparex/ui` for all generic presentation.
- Owns all admin-specific workflows, business table views, and moderation UIs.
- Must not re-implement any primitive already in `@esparex/ui`.

**Allowed Imports:** `@esparex/contracts`, `@esparex/shared`, `@esparex/ui`
**Forbidden Imports:** `@esparex/core`, `@esparex/backend-api`, `@esparex/apps-web`

---

## 2. Contribution Rules

### Adding to `@esparex/ui`

A component may be added to `@esparex/ui` **only** if it passes all of the following criteria:

| Criterion | Required |
| --------- | -------- |
| Used by >= 2 distinct applications | YES |
| Zero domain or business logic | YES |
| Zero routing or navigation awareness | YES |
| Zero API calls or data fetching | YES |
| Fully accessible (WCAG 2.2 AA) | YES |
| Generic props interface | YES |

If a component fails **any** criterion, it belongs in the application layer.

### Routing Decisions

| Work Type | Where it goes |
| --------- | ------------- |
| New generic UI primitive | `@esparex/ui` |
| New shared enums / types / DTOs | `@esparex/contracts` |
| New shared utility / constant | `@esparex/shared` |
| New user-facing business feature | `apps/web` |
| New admin-facing workflow | `apps/admin` |
| New domain business rule | `core/src/domains/*` |

### Prohibited Patterns

- Never import application code into a shared package.
- Never create a duplicate primitive if one already exists in `@esparex/ui`.
- Never hardcode z-index values in components — always import from `@esparex/ui`'s `Z_INDEX` token.
- Never add routing logic, `useRouter`, or `usePathname` into `@esparex/ui`.
- Never move a component to `@esparex/ui` speculatively — only when a confirmed second consumer exists.

### Preferred Patterns

- Prefer composition over inheritance.
- Prefer slot-based APIs (`headerActions`, `search`, `tabs`) for layout components.
- Prefer generic props with optional callbacks over internal state management in shared components.
- Prefer ARIA-native semantic HTML over custom implementations.

---

## 3. CI Enforcement

These checks are mandatory for every PR touching UI-related code.

| Check | Tool | Command | Status |
| ----- | ---- | ------- | ------ |
| TypeScript type safety | `tsc` | `npm run type-check` | Blocking |
| Import boundary validation | `dependency-cruiser` | `npm run guard:dependencies` | Blocking |
| Circular dependency detection | `madge` | `npm run guard:circular` | Blocking |
| Code duplication | `jscpd` | `npm run guard:duplicate-code` | Blocking |
| Dead code / unused exports | `knip` | `npm run guard:knip` | Report only (see Section 4) |
| Linting | `eslint` | `npm run lint` | Blocking |
| Tests | `vitest` / `jest` | `npm run test` | Blocking |

---

## 4. Tooling Guidance — `knip`

> IMPORTANT: `knip --fix` must NEVER be used in an automated or unreviewed context.

### Correct Usage

```bash
# Run in report mode — review output manually
npm run guard:knip
```

### Incorrect Usage

```bash
# Dangerous — auto-removes exports that may be used by runtime consumers
npx knip --fix
```

### Why

`knip` performs static analysis only. It cannot detect:
- Exports consumed via dynamic `import()` patterns
- Exports re-exported through complex barrel file chains
- Exports consumed by Playwright test mocks or test utilities

**Lesson learned (Sprint 9A):** Running `knip --fix` automatically stripped used exports from `packages/ui`
and `@esparex/shared`, causing TypeScript errors across the workspace. The fix was immediately reverted.
The `knip` output was then reviewed manually, and only safe removals were applied by hand.

**Policy:** Treat `knip` findings as advisory. A human engineer must review every flagged export before removing it.

---

## 5. When to Reopen the Program

The Design System Migration program was closed on 2026-07-24. Do NOT open a new migration initiative
unless one of the following triggers occurs:

| Trigger | Action |
| ------- | ------ |
| A third application joins the monorepo | Audit new app vs. `@esparex/ui` |
| Mobile adopts the shared UI package | Extend token system accordingly |
| A major visual redesign requires new primitive shapes | ADR required before extraction |
| WCAG standard revision requires structural component changes | Audit and patch primitives |
| A new reusable pattern emerges organically (>= 2 consumers) | Standard contribution flow |

All other UI work should be treated as **feature development**, not migration.

---

## 6. Migration Program Outcome Summary

| Layer | Status | Package |
| ----- | ------ | ------- |
| Design Tokens | Complete | `@esparex/ui` |
| Primitive Components | Complete | `@esparex/ui` |
| Pattern Components | Complete | `@esparex/ui` |
| Layout Primitives | Complete | `@esparex/ui` |
| Domain Components (Audit) | Kept in apps by design | `apps/*` |
| Repository Finalization | Complete | All |
| Architecture Documentation | Complete | `.agents/` |

> **Architectural decision**: Zero domain components were migrated in the final audit (Sprint 8).
> This was the correct outcome — not a failure. Domain-specific components contain routing, auth,
> and business orchestration that must remain within the application boundary.
