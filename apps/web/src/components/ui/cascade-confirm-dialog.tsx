"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { usePathname } from "next/navigation";

export interface CascadeDialogProps {
  isOpen: boolean;
  triggerField: string;
  dependentFields: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function CascadeConfirmDialog({
  isOpen,
  triggerField,
  dependentFields,
  onConfirm,
  onCancel,
}: CascadeDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change {triggerField}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 mt-2 text-sm text-muted-foreground">
              <p>
                Changing the <strong>{triggerField}</strong> will clear the following selections:
              </p>
              <ul className="list-disc pl-5 space-y-1 font-medium text-foreground">
                {dependentFields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
              <p className="pt-2">Do you want to continue?</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button" onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction type="button" onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Change {triggerField}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function useCascadeConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [triggerField, setTriggerField] = useState("");
  const [dependentFields, setDependentFields] = useState<string[]>([]);
  
  // Use a ref for the action to prevent stale closures and React state closure issues
  const actionRef = useRef<(() => void) | null>(null);
  
  // Close dialog on navigation to prevent stuck state
  const pathname = usePathname();
  useEffect(() => {
    setIsOpen(false);
    actionRef.current = null;
  }, [pathname]);

  const withCascadeConfirmation = useCallback(
    (field: string, affectedFields: string[], action: () => void) => {
      if (affectedFields.length === 0) {
        action();
        return;
      }

      actionRef.current = action;
      setTriggerField(field);
      setDependentFields(affectedFields);
      setIsOpen(true);
    },
    []
  );

  const handleConfirm = useCallback(() => {
    const action = actionRef.current;
    setIsOpen(false);
    if (action) {
      // Execute in next tick to allow dialog to close cleanly
      setTimeout(() => {
        action();
      }, 0);
      actionRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    actionRef.current = null;
  }, []);

  const dialogProps: CascadeDialogProps = {
    isOpen,
    triggerField,
    dependentFields,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  };

  return { withCascadeConfirmation, dialogProps, ConfirmDialog: CascadeConfirmDialog };
}
