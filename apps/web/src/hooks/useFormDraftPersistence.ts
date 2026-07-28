"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { UseFormReturn, FieldValues, Path, PathValue } from "react-hook-form";
import { generateIdempotencyKey } from "@/lib/listings/submissionUtils";

const DRAFT_VERSION = 1;
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours

export interface DraftStorageEnvelope<T> {
    version: number;
    updatedAt: number;
    idempotencyKey: string;
    form: T;
}

export function getBusinessDraftKey(userId?: string | null): string {
    return `esparex:draft:v1:business:${userId || "anonymous"}`;
}

export function useFormDraftPersistence<TFieldValues extends FieldValues>({
    form,
    userId,
    enabled = true,
    nonPersistedFields = ["idProof", "businessProof", "certificates", "images"],
}: {
    form: UseFormReturn<TFieldValues>;
    userId?: string | null;
    enabled?: boolean;
    nonPersistedFields?: Array<keyof TFieldValues | string>;
}) {
    const storageKey = getBusinessDraftKey(userId);
    const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateIdempotencyKey());
    const isRestoringRef = useRef(false);

    const clearDraft = useCallback(() => {
        try {
            if (typeof window !== "undefined") {
                window.sessionStorage.removeItem(storageKey);
            }
        } catch {
            // Ignore storage revocation errors
        }
    }, [storageKey]);

    // Restore draft on mount
    useEffect(() => {
        if (!enabled || typeof window === "undefined") return;

        try {
            const raw = window.sessionStorage.getItem(storageKey);
            if (!raw) return;

            const envelope = JSON.parse(raw) as DraftStorageEnvelope<Record<string, unknown>>;
            if (
                !envelope ||
                envelope.version !== DRAFT_VERSION ||
                typeof envelope.updatedAt !== "number" ||
                Date.now() - envelope.updatedAt > DRAFT_TTL_MS ||
                !envelope.form
            ) {
                clearDraft();
                return;
            }

            isRestoringRef.current = true;
            if (envelope.idempotencyKey) {
                setIdempotencyKey(envelope.idempotencyKey);
            }

            const nonPersistedSet = new Set(nonPersistedFields as string[]);
            Object.entries(envelope.form).forEach(([key, value]) => {
                if (nonPersistedSet.has(key)) return;
                if (value !== undefined && value !== null) {
                    form.setValue(key as Path<TFieldValues>, value as PathValue<TFieldValues, Path<TFieldValues>>, {
                        shouldDirty: true,
                        shouldValidate: false,
                    });
                }
            });
            isRestoringRef.current = false;
        } catch {
            clearDraft();
            isRestoringRef.current = false;
        }
    }, [enabled, storageKey, form, clearDraft]);

    // Save draft on form values change
    useEffect(() => {
        if (!enabled || typeof window === "undefined") return;

        const subscription = form.watch((formValues) => {
            if (isRestoringRef.current) return;

            const nonPersistedSet = new Set(nonPersistedFields as string[]);
            const storableValues: Record<string, unknown> = {};

            Object.entries(formValues).forEach(([key, val]) => {
                if (nonPersistedSet.has(key)) return;
                // Exclude File instances or raw file arrays
                if (val instanceof File) return;
                if (Array.isArray(val) && val.some((item) => item instanceof File)) return;
                storableValues[key] = val;
            });

            const envelope: DraftStorageEnvelope<Record<string, unknown>> = {
                version: DRAFT_VERSION,
                updatedAt: Date.now(),
                idempotencyKey,
                form: storableValues,
            };

            try {
                window.sessionStorage.setItem(storageKey, JSON.stringify(envelope));
            } catch {
                // Storage quota exceeded or blocked
            }
        });

        return () => subscription.unsubscribe();
    }, [enabled, storageKey, form, idempotencyKey, nonPersistedFields]);

    const resetIdempotencyKey = useCallback(() => {
        const nextKey = generateIdempotencyKey();
        setIdempotencyKey(nextKey);
        return nextKey;
    }, []);

    return {
        idempotencyKey,
        clearDraft,
        resetIdempotencyKey,
    };
}
