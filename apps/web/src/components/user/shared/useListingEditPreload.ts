"use client";

import React from "react";
import { getListingById } from "@/lib/api/user/listings";

interface UseListingEditPreloadOptions<TPayload extends Record<string, unknown>> {
    editId?: string;
    enabled?: boolean;
    onBeforeLoad?: () => void;
    onPayload: (payload: TPayload) => Promise<void> | void;
    onError?: (error: unknown) => void;
    onLoadingChange?: (isLoading: boolean) => void;
}

export function useListingEditPreload<TPayload extends Record<string, unknown>>({
    editId,
    enabled = true,
    onBeforeLoad,
    onPayload,
    onError,
    onLoadingChange,
}: UseListingEditPreloadOptions<TPayload>) {
    const [isFetchingData, setIsFetchingData] = React.useState(Boolean(editId && enabled));
    const loadedIdRef = React.useRef<string | null>(null);
    const callbacksRef = React.useRef({
        onBeforeLoad,
        onPayload,
        onError,
        onLoadingChange,
    });

    React.useEffect(() => {
        callbacksRef.current = {
            onBeforeLoad,
            onPayload,
            onError,
            onLoadingChange,
        };
    }, [onBeforeLoad, onPayload, onError, onLoadingChange]);

    React.useEffect(() => {
        if (!editId || !enabled) {
            loadedIdRef.current = undefined;
            setIsFetchingData(false);
            callbacksRef.current.onLoadingChange?.(false);
            return;
        }

        if (loadedIdRef.current === editId) {
            return;
        }
        loadedIdRef.current = editId;

        let isActive = true;

        const load = async () => {
            setIsFetchingData(true);
            callbacksRef.current.onLoadingChange?.(true);
            callbacksRef.current.onBeforeLoad?.();

            try {
                const payload = await getListingById(editId);
                if (!isActive || !payload) return;
                await callbacksRef.current.onPayload(payload as unknown as TPayload);
            } catch (error) {
                if (!isActive) return;
                loadedIdRef.current = undefined;
                callbacksRef.current.onError?.(error);
            } finally {
                if (!isActive) return;
                setIsFetchingData(false);
                callbacksRef.current.onLoadingChange?.(false);
            }
        };

        void load();

        return () => {
            isActive = false;
        };
    }, [editId, enabled]);

    return {
        isFetchingData,
    };
}
