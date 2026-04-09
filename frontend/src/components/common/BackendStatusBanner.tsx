"use client";

import { useBackendStatus } from "@/context/BackendStatusContext";
import { Z_INDEX } from "@/lib/zIndexConfig";

export function BackendStatusBanner() {
    const { isBackendUp, checked } = useBackendStatus();

    if (!checked || isBackendUp) return null;

    return (
        <div style={{ zIndex: Z_INDEX.backendStatusBanner }} className="bg-yellow-100 text-yellow-800 text-sm text-center py-2 px-4 shadow-sm border-b border-yellow-200 sticky top-0">
            Some services are temporarily unavailable. You can still browse, but login and transactions may be limited.
        </div>
    );
}
