"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Z_INDEX,
} from "@esparex/ui";
import { AlertTriangle } from 'lucide-react';


interface NavigationContextType {
    isDirty: boolean;
    setIsDirty: (dirty: boolean) => void;
    confirmNavigation: (action: () => void) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
    const [isDirty, setIsDirty] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    const confirmNavigation = useCallback((action: () => void) => {
        if (isDirty) {
            // Show app-based modal instead of browser confirm
            setPendingAction(() => action);
            setShowConfirmDialog(true);
        } else {
            action();
        }
    }, [isDirty]);

    const handleConfirm = () => {
        setIsDirty(false); // Reset dirty state since we are leaving
        setShowConfirmDialog(false);
        if (pendingAction) {
            pendingAction();
            setPendingAction(null);
        }
    };

    const handleCancel = () => {
        setShowConfirmDialog(false);
        setPendingAction(null);
    };

    const value = useMemo(() => ({
        isDirty,
        setIsDirty,
        confirmNavigation
    }), [isDirty, confirmNavigation]);

    return (
        <NavigationContext.Provider value={value}>
            {children}

            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent
                    style={{ zIndex: Z_INDEX.debugLayer }}
                    className="!rounded-xl !p-5 sm:!max-w-[440px]"
                >
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                        <div className="min-w-0 flex-1">
                            <DialogHeader className="!mb-0">
                                <DialogTitle className="text-lg font-semibold">
                                    Unsaved Changes
                                </DialogTitle>
                                <DialogDescription className="text-sm text-foreground-subtle mt-1">
                                    Leave this page? Your changes won&apos;t be saved.
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                    </div>
                    <DialogFooter className="!mt-5 !flex !flex-row items-center gap-2.5">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="h-10 flex-1 text-sm border-2 border-black"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirm}
                            className="h-10 flex-1 text-sm"
                        >
                            Leave
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </NavigationContext.Provider>
    );
}

export function useNavigation() {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
}
