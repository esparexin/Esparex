"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSmartAlerts } from "@/hooks/useSmartAlerts";
import { CreateSmartAlertDialog } from "@/components/user/profile/dialogs/CreateSmartAlertDialog";
import type { Location as AppLocation } from "@/lib/api/user/locations";

type SmartAlertLocationSelection = Pick<
    AppLocation,
    "id" | "locationId" | "name" | "display" | "city" | "coordinates"
>;

interface SmartAlertModalOptions {
    autoFocusCategory?: boolean;
}

interface SmartAlertModalContextType {
    isSmartAlertOpen: boolean;
    openSmartAlertModal: (options?: SmartAlertModalOptions) => void;
    closeSmartAlertModal: () => void;
    registerTabHandler: (handler: ((options?: SmartAlertModalOptions) => void) | null) => void;
}

const SmartAlertModalContext = createContext<SmartAlertModalContextType | undefined>(undefined);

export function SmartAlertModalProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [autoFocusCategory, setAutoFocusCategory] = useState(false);
    const tabHandlerRef = useRef<((options?: SmartAlertModalOptions) => void) | null>(null);

    const {
        smartAlertForm,
        updateSmartAlertForm,
        handleCreateAlert,
        resetAlertForm,
        isMutating,
        smartAlertErrors,
        smartAlertGlobalError,
    } = useSmartAlerts(false);

    const closeSmartAlertModal = useCallback(() => {
        setIsOpen(false);
        setAutoFocusCategory(false);
        resetAlertForm();
    }, [resetAlertForm]);

    // Close global modal on navigation to avoid orphaned overlays
    useEffect(() => {
        closeSmartAlertModal();
    }, [pathname, closeSmartAlertModal]);

    const registerTabHandler = useCallback((handler: ((options?: SmartAlertModalOptions) => void) | null) => {
        tabHandlerRef.current = handler;
    }, []);

    const openSmartAlertModal = useCallback((options?: SmartAlertModalOptions) => {
        // If a tab has registered a dedicated handler (e.g. SmartAlertsTab), delegate to it
        // to prevent duplicate modal instances in the DOM.
        if (tabHandlerRef.current) {
            tabHandlerRef.current(options);
            return;
        }
        resetAlertForm();
        setAutoFocusCategory(Boolean(options?.autoFocusCategory));
        setIsOpen(true);
    }, [resetAlertForm]);

    const handleOpenChange = useCallback((open: boolean) => {
        if (!open) {
            closeSmartAlertModal();
        }
    }, [closeSmartAlertModal]);

    const handleSubmit = useCallback(async (location: SmartAlertLocationSelection | null) => {
        const res = await handleCreateAlert(location);
        if (res?.success) {
            closeSmartAlertModal();
        }
    }, [handleCreateAlert, closeSmartAlertModal]);

    const value = useMemo(
        () => ({
            isSmartAlertOpen: isOpen,
            openSmartAlertModal,
            closeSmartAlertModal,
            registerTabHandler,
        }),
        [isOpen, openSmartAlertModal, closeSmartAlertModal, registerTabHandler]
    );

    return (
        <SmartAlertModalContext.Provider value={value}>
            {children}
            {isOpen && (
                <CreateSmartAlertDialog
                    open={isOpen}
                    onOpenChange={handleOpenChange}
                    formData={smartAlertForm}
                    updateFormData={updateSmartAlertForm}
                    onSubmit={handleSubmit}
                    onCancel={closeSmartAlertModal}
                    isEditing={false}
                    isMutating={isMutating}
                    errors={smartAlertErrors}
                    globalError={smartAlertGlobalError}
                    autoFocusCategory={autoFocusCategory}
                />
            )}
        </SmartAlertModalContext.Provider>
    );
}

export function useSmartAlertModal() {
    const context = useContext(SmartAlertModalContext);
    if (context === undefined) {
        throw new Error("useSmartAlertModal must be used within a SmartAlertModalProvider");
    }
    return context;
}
