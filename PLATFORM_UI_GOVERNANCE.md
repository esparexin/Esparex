# Esparex Platform UI Governance Contract (`PLATFORM_UI_GOVERNANCE.md`)

```text
Version:         v1.0.0
Status:          APPROVED & LOCKED
Owner:           Platform Architecture & Core UI/UX Team
Effective Date:  2026-08-07
Review Cadence:  Quarterly
Supersedes:      None
Governing ADRs:  ADR-001 (Design Tokens SSOT), ADR-002 (Component Ownership),
                 ADR-003 (Responsive Architecture), ADR-004 (Accessibility Baseline),
                 ADR-005 (Platform Boundary Rules)
```

---

## 🎯 1. Purpose & Scope

This contract serves as the living, authoritative constitutional document governing all user interface design, token management, component creation, responsive behavior, accessibility, and package boundaries across **Web (`apps/web`)**, **Admin (`apps/admin`)**, **Mobile Web**, **Android**, and **iOS (`apps/mobile`)**.

---

## 🏛️ 2. UI Foundation Principles

Every UI component, layout, and feature implemented across Esparex must adhere strictly to these 5 core principles:

1. **SSOT First**: Design tokens (`@esparex/design-tokens`) are the only authoritative source of design values.
2. **Composition Over Duplication**: Pages and screens must be assembled by composing shared primitives.
3. **Responsive by Default**: Interfaces adapt dynamically via CSS breakpoint utilities (`hidden md:flex`).
4. **Accessibility by Default**: Every interactive control meets WCAG 2.2 AA natively.
5. **Platform Consistency**: Web, Admin, Mobile Web, Android, and iOS share visual semantics while respecting platform conventions.

---

## 🌳 3. Component Creation Decision Tree

Before creating any new component, contributors must follow this decision flow:

```text
Need UI Component?
       │
       ▼
Does it already exist in @esparex/ui or @esparex/mobile-ui?
       ├── YES ──► CONSUME / RE-EXPORT IT
       └── NO
            │
            ▼
Is it shared across ≥2 applications without app-specific business logic?
       ├── YES ──► CREATE IN @esparex/ui OR @esparex/mobile-ui (Satisfy 7 Promotion Criteria)
       └── NO  ──► CREATE IN APPLICATION (apps/web or apps/mobile)
```

---

## 📊 4. Design Token & Package Ownership Matrix

### A. Design Token Group Ownership

| Token Group | Canonical Owner Package | Location |
|---|---|---|
| **Colors** | `@esparex/design-tokens` | `packages/design-tokens/src/colors.ts` |
| **Typography** | `@esparex/design-tokens` | `packages/design-tokens/src/typography.ts` |
| **Motion & Easing** | `@esparex/design-tokens` | `packages/design-tokens/src/motion.ts` |
| **Border Radius** | `@esparex/design-tokens` | `packages/design-tokens/src/radius.ts` |
| **Shadows & Elevation** | `@esparex/design-tokens` | `packages/design-tokens/src/shadows.ts` |
| **Breakpoints** | `@esparex/design-tokens` | `packages/design-tokens/src/breakpoints.ts` |
| **Spacing Scale** | `@esparex/design-tokens` | `packages/design-tokens/src/spacing.ts` |
| **Z-Index Scale** | `@esparex/design-tokens` | `packages/design-tokens/src/z-index.ts` |

### B. Package Stability Levels

| Package / App | Stability Level | API Rules |
|---|:---:|---|
| `@esparex/design-tokens` | 🔒 **Stable (Protected)** | Public contracts locked; ADR required before modifying tokens. |
| `@esparex/ui` | 🔒 **Stable (Protected)** | Shared Web primitives; breaking API changes strictly prohibited. |
| `@esparex/mobile-ui` | 🔒 **Stable (Protected)** | Shared Mobile primitives; breaking API changes strictly prohibited. |
| `apps/web` | ⚙️ **Adaptive (App)** | Web application layer; internal refactoring allowed within UI contract. |
| `apps/admin` | ⚙️ **Adaptive (App)** | Admin application layer; internal refactoring allowed within UI contract. |
| `apps/mobile` | ⚙️ **Adaptive (App)** | Mobile application layer; internal refactoring allowed within UI contract. |

---

## 🔍 5. Strict Definitions & Rules

### A. Strict Definition of "Duplicate Component"
A component is considered a duplicate **only if all 5 of the following criteria are true**:
1. Same responsibility.
2. Same public API.
3. Same behavior.
4. Same lifecycle.
5. Same ownership.

Components that merely look alike are treated as distinct implementations.

### B. Stricter Primitive Promotion Criteria
An application component may be promoted into `@esparex/ui` or `@esparex/mobile-ui` **only when it satisfies all 7 criteria**:
1. Consumed by $\ge 2$ independent applications.
2. Stable public API contract.
3. Platform-agnostic rendering.
4. Zero application-specific business logic.
5. 100% unit test coverage.
6. Complete JSDoc & usage documentation.
7. WCAG 2.2 AA accessibility verified.

---

## 🚫 6. Explicit Prohibitions ("Do Not" Rules)

1. **Do NOT hardcode colors**: Raw hex codes (`#2563eb`) are forbidden outside design tokens.
2. **Do NOT hardcode spacing values**: Magic numbers (`padding: 13px`) are forbidden.
3. **Do NOT introduce page-specific typography scales**.
4. **Do NOT duplicate shared primitives**.
5. **Do NOT create alternate responsive breakpoints**.
6. **Do NOT bypass design tokens** (Zero Inline Styles Policy).
7. **Do NOT create parallel navigation systems**.
8. **Do NOT introduce local design systems**.

---

## 🔄 7. Change Management, Exception Process & Governance Cadence

* **ADR Requirement**: Token or core primitive modifications require an ADR (`ADR-001` through `ADR-005`).
* **Controlled Exception Process**: Exception Request ➔ Architecture Review ➔ Time-Limited Approval ➔ Resolution before Release.
* **Deprecation Lifecycle**: `Experimental` ➔ `Supported` ➔ `Deprecated` ➔ `Removal Scheduled` ➔ `Removed`.
* **Quarterly Review Cadence**: Formal review every quarter by Platform Architecture. Next review: **November 2026**.

---

## 🤖 8. CI Enforcement & Architectural Health KPIs

### A. Automated Guard Specifications
- `npm run guard:shared-ssot` — Enforces 0 local primitive duplicates in `apps/web/src/components/ui/`.
- `npm run guard:design-tokens` — Verifies 0 raw hex colors or inline spacing bypasses.
- `npm run guard:responsive` — Enforces zero non-standard media queries outside `breakpoints.ts`.

### B. Target Architectural Health KPIs
* **0** duplicate shared primitives.
* **0** orphan shared components.
* **100%** design token coverage.
* **100%** WCAG 2.2 AA accessibility compliance.
* **0** hardcoded colors or inline spacing values.
* **100%** type-safe shared component contracts.

---

## 📋 9. Architecture PR Review Checklist

Every UI PR must be reviewed against this checklist before merging:
- [ ] Uses shared primitives from `@esparex/ui` / `@esparex/mobile-ui` where appropriate.
- [ ] Introduces no duplicate component implementations.
- [ ] Uses `@esparex/design-tokens` exclusively for all colors, spacing, and typography.
- [ ] Preserves single-instance responsive architecture rules.
- [ ] Satisfies WCAG 2.2 AA accessibility requirements ($\ge 44\text{dp}$ touch targets, visible focus).
- [ ] Introduces zero unnecessary public component APIs.
- [ ] Passes all automated governance guards (`npm run repo:gate`).
