# Critical Investigation: Post Ad Category Selection Reset

This document details the forensic audit, root cause, and resolution of the Post Ad category selection reset issue.

---

## 1. Executive Summary
When attempting to change the Category on the Post Ad page after previously making selections (Category → Brand → Model → Spare Parts), the application became unresponsive to the reset action. Clicking "Change Category" in the confirmation modal closed the modal but failed to clear the old selections or apply the new category. A forensic audit revealed a React/Radix UI asynchronous race condition within the cascade confirmation hook (`useCascadeConfirmation`). When the confirmation action was confirmed, the dialog closed synchronously, triggering a hook cancellation event that cleared the pending callback ref (`actionRef.current = null`) immediately *before* the callback could execute in its scheduled `setTimeout` task.

---

## 2. State Transition Diagram

```
[Initial State: Empty]
        ↓
[Category Selected: Mobiles] ──(fetches Mobiles brands, spare parts)
        ↓
[Brand Selected: Apple]
        ↓
[Model Selected: iPhone 13]
        ↓
[Spare Parts Selected: Battery, Screen]
        ↓
[Category Changed: User clicks "Laptops"]
        ↓
[Cascade Confirmation Modal Opens] ──(detects active brand, model, parts)
        ↓
[User Clicks "Change Category"]
        ↓
┌─────────────────────── Race Condition ───────────────────────┐
│ 1. Dialog closes & triggers onOpenChange(false)              │
│ 2. onOpenChange calls onCancel() synchronously               │
│ 3. onCancel resets actionRef.current = null                  │
│ 4. setTimeout task executes but actionRef.current is null    │
└──────────────────────────────────────────────────────────────┘
        ↓
[State Reset Fails / Selected Category remains "Mobiles" / Old Selections Survive]
```

*After Fix Implementation:*
```
[User Clicks "Change Category"]
        ↓
[Capture actionRef.current locally as "action"]
        ↓
[Dialog Closes (sets isOpen=false) / actionRef.current = null (in next tick)]
        ↓
[Synchronous local "action()" Executes]
        ↓
[form.setValue("category", "Laptops") + clearCategoryDependents() runs instantly]
        ↓
[Mobiles Brand/Model/Spare Parts cleared; Laptops Brand/Spare Parts loaded successfully]
```

---

## 3. Root Cause Analysis
The issue lies inside the `useCascadeConfirmation` hook within:

[apps/web/src/components/ui/cascade-confirm-dialog.tsx](file:///c:/Users/Administrator/Documents/GitHub/Esparex/apps/web/src/components/ui/cascade-confirm-dialog.tsx)

```typescript
  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (actionRef.current) {
      // Execute in next tick to allow dialog to close cleanly
      setTimeout(() => {
        if (actionRef.current) { // ← TRAPPED BY RACE CONDITION
          actionRef.current();
          actionRef.current = null;
        }
      }, 0);
    }
  }, []);
```

### The Race Condition Mechanism:
1. When the user clicks the `<AlertDialogAction onClick={onConfirm}>` button, it calls `handleConfirm()`.
2. `handleConfirm()` calls `setIsOpen(false)`, triggering a transition to close the dialog.
3. Radix UI's `<AlertDialog>` primitive closes, which triggers `onOpenChange(false)` synchronously.
4. The dialog container translates `onOpenChange(false)` into `onCancel()`, which executes `handleCancel()`:
   ```typescript
     const handleCancel = useCallback(() => {
       setIsOpen(false);
       actionRef.current = null; // ← Resets ref to null
     }, []);
   ```
5. The browser's microtask/macrotask queue finally executes the `setTimeout` callback.
6. The `setTimeout` body checks `if (actionRef.current)`. However, `actionRef.current` is now `null` (cleared by `handleCancel()`).
7. As a result, the action (`handleCategoryChange`) **never runs**, leaving the category reset completely blocked.

---

## 4. Backend Findings
The backend APIs and master data services are functioning properly. 
* **Zero stale dependencies:** The master data endpoints for brands, models, and spare parts (`/api/v1/master-data/...`) are designed to be category-scoped and stateless. They correctly receive the new `categoryId` and return only relevant entities.
* **No lockups:** There are no backend database locks or infinite query loops. The hang is entirely client-side.

---

## 5. Frontend Findings
* **Query Caching:** TanStack Query handles active query invalidation correctly. When the category is changed, `brandsQuery` is keyed on `activeCategoryId`. However, `modelsQuery` is keyed on `selectedBrandId`. When `selectedBrandId` becomes `""`, `modelsQuery` is disabled but retains the old brand's models in cache. This is resolved cleanly because the UI unmounts the `ModelSearchSelect` when `brandIdValue` is empty, preventing stale UI display.
* **Race Condition in Confirmation hook:** The dialog closure intercepting ref mutations was the sole blocker.

---

## 6. Minimal Fix Plan
Rather than refactoring the dialog library or state context, we solve the race condition by **capturing the callback locally** before the state changes and closing transition triggers.

### Code Modification

```diff
// apps/web/src/components/ui/cascade-confirm-dialog.tsx
   const handleConfirm = useCallback(() => {
+    const action = actionRef.current;
     setIsOpen(false);
-    if (actionRef.current) {
+    if (action) {
       // Execute in next tick to allow dialog to close cleanly
       setTimeout(() => {
-        if (actionRef.current) {
-          actionRef.current();
-          actionRef.current = null;
-        }
+        action();
       }, 0);
+      actionRef.current = null;
     }
   }, []);
```

By caching `actionRef.current` in a local `action` constant before calling `setIsOpen(false)`, the callback remains accessible to the `setTimeout` closure even after the synchronous close callback resets `actionRef.current` to `null`.

---

## 7. Verification Checklist

- [x] **Race Condition Eliminated:** Captured callback resolves properly regardless of Radix UI dialog closure sequence.
- [x] **Category Reset Success:** Changing the category on Post Ad page successfully clears Brand, Model, and Spare Parts selections.
- [x] **No Application Hangs:** Confirming Category change executes instantly (no frozen state or infinite render loops).
- [x] **No Stale Query Cache:** Correct queries are triggered for the new category (probed in browser and console).
- [x] **Type Integrity:** Workspace type-checks with 0 compilation errors.
- [x] **Clean Working State:** Both mobile viewports and desktop layouts load and reset category lists without issue.
