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
} from "@esparex/ui";

export interface BusinessLifecycleDialogsProps {
    showDeactivateDialog: boolean;
    setShowDeactivateDialog: (open: boolean) => void;
    isDeactivating: boolean;
    onConfirmDeactivate: () => void;
    showCloseDialog: boolean;
    setShowCloseDialog: (open: boolean) => void;
    isClosing: boolean;
    onConfirmClose: () => void;
}

export function BusinessLifecycleDialogs({
    showDeactivateDialog,
    setShowDeactivateDialog,
    isDeactivating,
    onConfirmDeactivate,
    showCloseDialog,
    setShowCloseDialog,
    isClosing,
    onConfirmClose,
}: BusinessLifecycleDialogsProps) {
    return (
        <>
            {/* Deactivate Confirmation Dialog */}
            <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
                <AlertDialogContent className="max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-h4 font-bold text-foreground">
                            Deactivate Business
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-body text-muted-foreground mt-2 leading-relaxed">
                            Are you sure you want to deactivate your business? Your listings and services will be hidden from public view until you reactivate.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex gap-3 pt-4 sm:justify-end">
                        <AlertDialogCancel disabled={isDeactivating} className="h-10 rounded-xl px-4 font-semibold border-border">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isDeactivating}
                            onClick={(e) => {
                                e.preventDefault();
                                onConfirmDeactivate();
                            }}
                            className="h-10 rounded-xl px-4 font-semibold border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100"
                        >
                            {isDeactivating ? "Deactivating..." : "Deactivate"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Close Business Confirmation Dialog */}
            <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
                <AlertDialogContent className="max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-h4 font-bold text-destructive">
                            Close Business Permanently
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-body text-muted-foreground mt-2 leading-relaxed">
                            Are you sure you want to permanently close your business? This action cannot be undone and your business account role will be reverted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex gap-3 pt-4 sm:justify-end">
                        <AlertDialogCancel disabled={isClosing} className="h-10 rounded-xl px-4 font-semibold border-border">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isClosing}
                            onClick={(e) => {
                                e.preventDefault();
                                onConfirmClose();
                            }}
                            className="h-10 rounded-xl px-4 font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                            {isClosing ? "Closing Business..." : "Close Business"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
