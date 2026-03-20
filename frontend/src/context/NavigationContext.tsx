"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
                <DialogContent className="max-w-md z-[9999]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Unsaved Changes
                        </DialogTitle>
                        <DialogDescription>
                            You have unsaved changes. Are you sure you want to leave? All your progress will be lost.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="w-full sm:w-auto"
                        >
                            Stay on Page
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirm}
                            className="w-full sm:w-auto"
                        >
                            Leave Anyway
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
