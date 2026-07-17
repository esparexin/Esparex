"use client";

import { useState, useCallback } from "react";
import type { Listing } from "@/lib/api/user/listings/normalizer";

export function usePostAdWizardState(isEditMode: boolean, editAdId?: string) {
    const [currentStep, setCurrentStep] = useState(isEditMode ? 2 : 1);
    const [stepValidationAttempts, setStepValidationAttempts] = useState<Record<number, boolean>>({});
    const [mode, setMode] = useState<'create' | 'edit'>(isEditMode ? 'edit' : 'create');
    const [listingId, setListingId] = useState<string | undefined>(editAdId);
    const [originalAdStatus, setOriginalAdStatus] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [submittedAd, setSubmittedAd] = useState<Listing | null>(null);
    const [userHasInteracted, setUserHasInteracted] = useState(false);

    const resetToCreateMode = useCallback(() => {
        setMode('create');
        setListingId(undefined);
        setCurrentStep(1);
        setOriginalAdStatus(null);
        setSubmittedAd(null);
        setUserHasInteracted(false);
        setStepValidationAttempts({});
    }, []);

    return {
        currentStep,
        setCurrentStep,
        stepValidationAttempts,
        setStepValidationAttempts,
        mode,
        setMode,
        listingId,
        setListingId,
        originalAdStatus,
        setOriginalAdStatus,
        isLoading,
        setIsLoading,
        submittedAd,
        setSubmittedAd,
        userHasInteracted,
        setUserHasInteracted,
        resetToCreateMode,
    };
}
