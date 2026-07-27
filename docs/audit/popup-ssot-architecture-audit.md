# Enterprise Popup / Modal / Toast Architecture Audit & SSOT Governance

## Objective

This document establishes the single authoritative reference for the Esparex Popup, Modal, Toast, and Dialog system architecture. It documents the platform-wide audit, canonical Single Source of Truth (SSOT), and migration strategy to eliminate legacy, duplicate, or zombie popup infrastructure.

---

## 1. Single Source of Truth (SSOT) Architecture

The Esparex platform enforces a **single-instance, priority-queued native popup architecture** across all user-facing applications (User Web App and Admin Dashboard):

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Unified Popup Bus                             │
│       createUnifiedPopupBus("web")  /  createUnifiedPopupBus("admin")   │
│            (packages/shared/src/popup/popupCore.ts)                     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            usePopupQueue                                │
│       Priority Queueing (Error/Confirm=3 > Warning=2 > Info=1)          │
│       2000ms Event Deduplication & Single-Instance State                │
│            (packages/ui/src/hooks/usePopupQueue.ts)                     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           PopupDialogView                               │
│       Radix UI Accessible Content, Focus Trap & Motion Animation        │
│            (packages/ui/src/popup/popupDialogView.tsx)                  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
    ┌─────────────────────────┐             ┌─────────────────────────┐
    │       AppPopup          │             │       AdminPopup        │
    │     (apps/web)          │             │      (apps/admin)       │
    └─────────────────────────┘             └─────────────────────────┘
```

### Dialog & Modal SSOT
- `Dialog` & `AlertDialog` (`packages/ui/src/atoms/Dialog.tsx`, `AlertDialog.tsx`): Built on `@radix-ui/react-dialog` & `@radix-ui/react-alert-dialog`.
- `Drawer` & `Sheet` (`packages/ui/src/atoms/Drawer.tsx`, `Sheet.tsx`): Built on `vaul` & `@radix-ui/react-dialog`.

---

## 2. Dependency Audit Results

| Package / Library | Status | Governance Policy |
| --- | --- | --- |
| `@radix-ui/react-dialog` | Active | Canonical Dialog Primitive |
| `@radix-ui/react-alert-dialog` | Active | Canonical Alert Dialog Primitive |
| `@radix-ui/react-dropdown-menu` | Active | Canonical Dropdown / Popover Primitive |
| `vaul` | Active | Canonical Mobile Touch Drawer Primitive |
| `react-hot-toast` / `sonner` / `react-toastify` / `notistack` | Not Installed | **Strict Ban** per Platform Governance Rule 13 |

---

## 3. Audit Findings & Legacy Deletion Plan

### Legacy Toast Context (`apps/admin/src/context/ToastContext.tsx`)
- **Status**: Zombie / Legacy No-op.
- **Problem**: 14 admin files imported `useToast` from `ToastContext.tsx` which had a dummy `showToast` method (`// No-op`).
- **Remediation**:
  1. Migrate all 14 `useToast` consumers to `showAdminPopup` from `@/lib/popup/popupEvents`.
  2. Remove `ToastProvider` wrapper from `AdminProviders.tsx`.
  3. Delete `ToastContext.tsx`.

---

## 4. Migration Verification Checklist

- [x] All admin toast calls use `showAdminPopup({ type, title, message })`.
- [x] `AdminPopupProvider` wraps all admin routes in root layout.
- [x] `npm run lint` passes with 0 errors.
- [x] `npm run type-check` passes cleanly.
- [x] `npm run build` succeeds cleanly.
- [x] Repository search confirmed exactly 0 references remain to `ToastContext`, `ToastProvider`, and `useToast`.
- [x] Single-instance native popup SSOT architecture fully enforced platform-wide.
