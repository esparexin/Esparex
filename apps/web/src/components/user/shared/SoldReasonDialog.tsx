"use client";

/**
 * Re-export shim for backwards compatibility.
 * SSOT component is now MarkAsSoldDialog.
 */
export {
  MarkAsSoldDialog,
  MarkAsSoldDialog as SoldReasonDialog,
  type SoldReason,
  type MarkAsSoldDialogProps,
  type MarkAsSoldDialogProps as SoldReasonDialogProps,
  SOLD_REASON_OPTIONS,
} from "./MarkAsSoldDialog";
