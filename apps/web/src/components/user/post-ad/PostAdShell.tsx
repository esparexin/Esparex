"use client";

import React, { useCallback } from "react";
import { usePostAdAction, usePostAdState } from "./context";
import { PostAdFormSkeleton } from "./loading/PostAdFormSkeleton";
import { AlertCircle, RefreshCcw, WifiOff } from "@/icons/IconRegistry";
import { useBackendStatus } from "@/context/BackendStatusContext";
import { mapErrorToMessage } from "@/lib/errorMapper";
import { apiClient } from "@/lib/api/client";

/**
 * 🧱 PostAdShell
 *
 * Implements the strict 4-State Rule for the Post Ad page.
 * 1. LOADING: PostAdFormSkeleton
 * 2. ERROR: Friendly Error Card
 * 3. CONTENT: Children (The Form)
 * 4. EMPTY: (Not currently used for Post Ad, but reserved)
 *
 * GOVERNANCE FIX:
 * - Replaces window.location.reload() with soft state recovery.
 * - Offline retry: triggers a fresh health check via apiClient.
 * - Error retry: clears the load error and re-triggers catalog loading.
 * - Preserves React Query cache and all application state.
 * - Prevents SSR re-execution and request storms.
 */
export function PostAdShell({ children }: { children: React.ReactNode }) {
    const { isLoading, loadError } = usePostAdState();
    const { setLoadError, loadBrandsForCategory } = usePostAdAction();
    const { isBackendUp } = useBackendStatus();

    /**
     * Offline retry handler.
     *
     * Triggers a non-blocking health check so the BackendStatusContext
     * can update isBackendUp when the server comes back online.
     * Does NOT reload the page or restart SSR.
     */
    const handleOfflineRetry = useCallback(() => {
        void apiClient.checkHealth();
    }, []);

    /**
     * Error retry handler.
     *
     * Clears the load error so the form re-renders, then re-runs
     * catalog loading for the current category. This is a pure
     * client-side state reset — no navigation, no SSR restart.
     */
    const handleErrorRetry = useCallback(() => {
        setLoadError(null);
        void loadBrandsForCategory("");
    }, [setLoadError, loadBrandsForCategory]);

    // 0. 📶 OFFLINE State
    if (!isBackendUp) {
        return (
            <div
                role="alert"
                aria-live="assertive"
                className="flex items-center justify-center w-full min-h-[60vh] p-4"
            >
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-amber-100">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <WifiOff className="w-8 h-8 text-amber-600" aria-hidden="true" />
                    </div>

                    <h2 className="text-xl font-bold text-foreground mb-2">
                        Service Unavailable
                    </h2>

                    <p className="text-foreground-tertiary mb-8">
                        We are currently unable to connect to our servers. You
                        cannot post new ads at this time.
                    </p>

                    <button
                        type="button"
                        onClick={handleOfflineRetry}
                        aria-label="Check connection again"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white font-medium rounded-full hover:bg-amber-700 transition-colors w-full sm:w-auto"
                    >
                        <RefreshCcw className="w-4 h-4" aria-hidden="true" />
                        Check Again
                    </button>
                </div>
            </div>
        );
    }

    // 1. ⏳ LOADING State
    if (isLoading) {
        return <PostAdFormSkeleton />;
    }

    // 2. ⚠️ ERROR State
    if (loadError) {
        return (
            <div
                role="alert"
                aria-live="assertive"
                className="flex items-center justify-center w-full min-h-[60vh] p-4"
            >
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-red-100">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-red-600" aria-hidden="true" />
                    </div>

                    <h2 className="text-xl font-bold text-foreground mb-2">
                        Listing Setup Unable to Load
                    </h2>

                    <p className="text-foreground-tertiary mb-8">
                        {mapErrorToMessage(
                            loadError,
                            "We encountered an issue loading the necessary data. Please try again."
                        )}
                    </p>

                    <button
                        type="button"
                        onClick={handleErrorRetry}
                        aria-label="Retry loading the post ad form"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-medium rounded-full hover:bg-slate-800 transition-colors w-full sm:w-auto"
                    >
                        <RefreshCcw className="w-4 h-4" aria-hidden="true" />
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // 3. ✅ CONTENT State
    return <>{children}</>;
}