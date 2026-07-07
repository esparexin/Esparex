---
id: JRN-ADMIN-001
title: Admin Management Journey
status: approved
pattern-version: 1.0.0
owner: Platform
since: "1.5.0"
last-reviewed: 2026-07-06
review-frequency: quarterly
related-patterns:
  - UX-NAV-001
  - UX-FORM-001
  - UX-FORM-002
  - UX-FORM-003
  - UX-FORM-004
  - UX-FORM-005
  - UX-DATA-001
  - UX-DATA-002
  - UX-DLG-001
  - UX-DLG-002
---

# JRN-ADMIN-001 — Admin Management Journey

## Overview

The Admin Management Journey covers how back-office operations staff log in, navigate tools, audit resources, search/filter/sort list items, paginated through data tables, view detail metrics, and modify or delete entries. It links the entire admin experience together.

---

## Journey Map

```
[Entry — Admin Dashboard]  ←  Pattern: UX-DATA-002
  Admin logs in and lands on overview dashboard
  Reviews metric cards (total sales, count widgets)
  Uses collapsable sidebar to select section (UX-NAV-001)

        ↓ [Admin clicks "Bookings" in sidebar]

[Bookings Directory]  ←  Pattern: UX-DATA-001
  Loads bookings list table
  ├── Default sorting applied (UX-FORM-004)
  ├── Grid skeletons active during load (UX-STATE-002)
  └── Query filters active (UX-FORM-003)

        ↓ [Admin executes search / filter / sort]

[Refining Data List]
  Admin searches for reference ID or email (UX-FORM-002)
  System updates rows and resets pagination to page 1 (UX-FORM-005)
  Admin clicks date header to sort rows (UX-FORM-004)
  Admin filters status to "Confirmed" (UX-FORM-003)

  Zero Results Path:
  └── No records match → render EmptyState composite (UX-STATE-001)

        ↓ [Admin clicks a row cell]

[Viewing Resource Detail Modal]
  Overlay dialog opens displaying billing info, tickets, status log
  Admin chooses to cancel booking or edit customer email

        ↓ [Admin clicks "Cancel Booking" CTA]

[Step 1 — Cancellation Confirmation]  ←  Pattern: UX-DLG-001
  Modal dialog prompts admin to confirm and input reason

        ↓ [Admin clicks "Confirm Cancel"]

[Step 2 — Destructive Action Handoff]  ←  Pattern: UX-DLG-002
  Submit button disables and shows spinner
  System updates booking status on database (adminCancelBooking)

  API Fail:
  └── Operation rejects → modal displays error, stays open

        ↓

[Step 3 — Success & Sync]  ←  Pattern: UX-STATE-004
  Cancellation modal closes
  Detail modal updates
  Admin query cache invalidated (table list refetched)
  Success notification toast alerts admin
```

---

## Handoff & State Sync Matrix

| Stage | Triggering Action | Source Pattern | Target Pattern | State Variable Synced |
|---|---|---|---|---|
| Navigation | Click sidebar link | `UX-NAV-001` | `UX-DATA-001` / `UX-DATA-002` | `pathname` (URL router) |
| List Filter | Dropdown selection | `UX-FORM-003` | `UX-DATA-001` | `eventFilter` / `statusFilter` (page = 1) |
| Row Action | Row click | `UX-DATA-001` | `UX-DLG-001` | `selectedBooking` state |
| Destructive Confirm | Submit button click | `UX-DLG-001` | `UX-DLG-002` | `cancelTarget` API ID |

---

## Experience Guardrails

1. **RBAC Handoffs**: Navigation sidebar links are dynamically toggled based on current admin permissions to prevent unauthorized routing.
2. **Table Pagination Reset**: Any search query modifications, filter changes, or sorting updates must automatically reset active pagination page counts back to 1.
3. **Optimistic Refetching**: Cache queries are immediately marked invalid upon successful edit or delete mutations to trigger fresh row data fetches.

---

## Change History

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07-06 | Initial publication |
