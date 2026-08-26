"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./AlertDialog";

export interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title = "Discard Unsaved Changes?",
  description = "If you leave now, your unsaved changes will be lost.",
  confirmLabel = "Discard",
  cancelLabel = "Keep Editing",
}: UnsavedChangesDialogProps) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xs sm:max-w-sm rounded-2xl bg-card p-5 shadow-2xl border border-border">
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className="text-body sm:text-small-title font-bold text-foreground tracking-tight">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-caption text-muted-foreground mt-1 leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3 sm:justify-end">
          <AlertDialogCancel
            onClick={handleCancel}
            className="h-9 text-caption font-semibold rounded-xl border-border px-4 transition-colors"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="h-9 text-caption font-semibold rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 transition-colors active:scale-[0.98]"
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
