'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@esparex/ui";

interface BlockChatDialogProps {
  open: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function BlockChatDialog({ open, isSubmitting, onCancel, onConfirm }: BlockChatDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !isSubmitting) onCancel(); }}>
      <AlertDialogContent className="max-w-md pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            🚫 Block this user?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This chat will become read-only and you won&apos;t receive further messages.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            {isSubmitting ? 'Blocking…' : 'Block'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
