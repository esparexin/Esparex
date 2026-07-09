---
id: UX-NAV-001
title: Navigation Pattern
status: approved
priority: high
pattern-version: 1.0.0
owner: Platform
since: "1.5.0"
last-reviewed: 2026-07-06
review-frequency: quarterly
related-journeys:
  - JRN-ADMIN-001
related-patterns: []
related-components:
  - Drawer
---

# UX-NAV-001 — Navigation Pattern

## 1. Overview

The Navigation pattern covers global page routing, sidebar layout menus for back-office admin surfaces, and top-level nav bars for public web audiences. It standardizes active state highlighting, responsive drawers for mobile viewports, transition animations, and Role-Based Access Control (RBAC) link hiding.

---

## 2. Applicable Surfaces

| Surface | Route | Notes |
|---|---|---|
| Admin | All routes | Persistent admin sidebar with collapsable and mobile configurations |
| Web | All routes | Header navbar with login trigger modal |

---

## 3. Source of Truth

```
apps/admin/src/components/AdminSidebar.tsx — Admin sidebar with collapsable and RBAC logic
apps/admin/src/components/AdminShell.tsx — Shell layout wrapping navigation
```

---

## 4. Evidence Reviewed

```
Source files (audited 2026-07-06):
  - apps/admin/src/components/AdminSidebar.tsx
  - apps/admin/src/components/AdminShell.tsx
  - apps/admin/src/lib/rbac/navigation-permissions.ts
```

---

## 5. Shared Components Used

| Component | From | Purpose |
|---|---|---|
| `Drawer` | `@mad/ui` | Responsive sidebar overlay container for mobile screens |

---

## 6. State Diagram

```
Sidebar Idle
 ├── [hover link] → Highlighting item
 ├── [collapse toggle] → Animated width transition (240px ↔ 64px)
 └── [responsive mobile view]
      ├── [mobileOpen = false] → Hidden (translate-x-full offscreen)
      └── [mobileOpen = true] → Drawer overlay open (slide in)
```

---

## 7. Required States

| State | Description | Component/Implementation |
|---|---|---|
| `expanded` | Sidebar fully open displaying icons and text | Expanded state (`width: 240`) |
| `collapsed` | Sidebar closed displaying icons only | Collapsed state (`width: 64`) |
| `mobile-drawer` | Sidebar loaded inside Drawer overlay for mobile devices | `Drawer` primitive |

---

## 8. Optional States

| State | Description |
|---|---|
| `item-disabled` | Grayed out navigation option representing coming-soon or lack of access |

---

## 9. Keyboard & Accessibility

- **Keyboard Tab Traversal**: Navigation links must be tab-navigable in order. Focus indicators must be visible.
- **Collapse button**: Toggle buttons must have appropriate `aria-label` changing between `"Collapse sidebar"` and `"Expand sidebar"`.
- **Drawer closing**: Mobile navigation drawer overlays must support Escape key closes and return focus to the hamburger toggle trigger.
- **WCAG AA criteria**:
  - **1.4.3 Contrast**: Active states (`text-white`) and inactive states (`text-text-muted`) must satisfy appropriate contrast targets.
  - **2.4.3 Focus Order**: Focus follows sidebar item progression.

---

## 10. Cross-Pattern Dependencies

There are no direct pattern dependencies.

---

## 11. Implementation Checklist

```
☐ Nav item active state matches current pathname prefix (pathname.startsWith)
☐ Access permissions checked per-item using RBAC helpers (canAccessRoute)
☐ Collapse state uses animated transitions (framer-motion) with set durations (0.25s)
☐ Mobile drawer fallback utilizes Drawer composite from @mad/ui
☐ Navigation container uses semantic HTML5 <aside> or <nav> elements
☐ Collapse toggle button contains explicit aria-label
☐ Icons inside list links include aria-hidden="true" or empty tags to prevent duplicate screen reader labels
```

---

## 12. Governance Rules

#### Required
```
✓ Must check user authorization level (RBAC navigation-permissions) before rendering admin sidebar items
✓ Must use semantic HTML5 nav containers (<aside> or <nav>)
✓ Active status states must be highlighted visually and programmatically using current URL path prefix mapping
```

#### Forbidden
```
✗ Rendering links in sidebar to routes that the current user cannot access
✗ Hardcoding custom width animation behaviors outside standard tokens
```

---

## 13. Design Decisions

| Decision | Record | Rationale Summary |
|---|---|---|
| Collapsible sidebar navigation | ADR (to be linked) | Maximizes usable admin interface viewport size on smaller screens while retaining quick icon access |

---

## 14. Backlog Gaps

No missing `@mad/ui` components block this pattern.

---

## 15. Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication |
