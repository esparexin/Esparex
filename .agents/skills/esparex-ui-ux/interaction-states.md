# Esparex Component Interaction-State Governance

Every interactive UI component MUST explicitly implement all applicable interaction states:

---

## 1. State Matrix

```text
Default ──► Hover ──► Focus-Visible ──► Active / Pressed ──► Loading / Processing ──► Disabled
```

| State | Visual Behavior | Accessibility Requirement |
|---|---|---|
| **Default** | Normal theme background, standard text contrast | `aria-disabled="false"` |
| **Hover** | Subtle background shift (`hover:bg-slate-100` / `hover:bg-action-dark`), pointer cursor | Cursor pointer |
| **Focus-Visible** | `focus-visible:ring-2 focus-visible:ring-action focus-visible:outline-none` | Visible focus ring on keyboard `Tab` |
| **Active / Pressed**| Scale shift or darker background (`active:scale-[0.98]`) | Immediate touch/click feedback |
| **Loading** | Spinner or skeleton state with `disabled` interaction | `aria-busy="true"`, `disabled={true}` |
| **Disabled** | Opacity reduction (`opacity-50 cursor-not-allowed`) | `disabled={true}`, `aria-disabled="true"` |
| **Error** | Red border (`border-error`), message text (`text-error`) | `aria-invalid="true"`, `aria-describedby` error ID |

---

## 2. Native Popup & Notification Integration

Esparex uses a **single-instance native popup architecture** (`popupBus`, `notify`, `AppPopup`).

- **Toast Libraries Banned**: Do NOT install or import `sonner`, `react-hot-toast`, `react-toastify`, or `<Toaster />`.
- **Dispatch Pattern**:
  ```typescript
  import { notify } from '@/lib/popupBus';

  // Success notification
  notify.success('Listing created successfully');

  // Error alert
  notify.error('Failed to update campaign: Network connection lost');
  ```
- **Priority Queue**: `error` & `confirm` = Priority 3 > `warning` = Priority 2 > `info` = Priority 1.
