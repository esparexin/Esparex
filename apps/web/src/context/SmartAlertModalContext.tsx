"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
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
}

const SmartAlertModalContext = createContext<SmartAlertModalContextType | undefined>(undefined);

export function SmartAlertModalProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [autoFocusCategory, setAutoFocusCategory] = useState(false);

    const {
        smartAlertForm,
        updateSmartAlertForm,
        handleCreateAlert,
        resetAlertForm,
        isMutating,
        smartAlertErrors,
        smartAlertGlobalError,
    } = useSmartAlerts(false);

    const openSmartAlertModal = useCallback((options?: SmartAlertModalOptions) => {
        resetAlertForm();
        setAutoFocusCategory(Boolean(options?.autoFocusCategory));
        setIsOpen(true);
    }, [resetAlertForm]);

    const closeSmartAlertModal = useCallback(() => {
        setIsOpen(false);
        setAutoFocusCategory(false);
        resetAlertForm();
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
        }),
        [isOpen, openSmartAlertModal, closeSmartAlertModal]
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
