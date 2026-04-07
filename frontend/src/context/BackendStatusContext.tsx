"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
    API_ROUTES,
    API_V1_BASE_PATH,
    DEFAULT_LOCAL_API_ORIGIN,
} from "@/lib/api/routes";
import { resolveBrowserApiBaseUrl } from "@/lib/api/browserApiBase";

type BackendStatus = {
    isBackendUp: boolean;
    checked: boolean;
};

const BackendStatusContext = createContext<BackendStatus>({
    isBackendUp: false,
    checked: false,
});

const HEALTH_CHECK_INTERVAL_MS = 2 * 60 * 1000; // re-check every 2 minutes

export function BackendStatusProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isBackendUp, setIsBackendUp] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const apiBase = resolveBrowserApiBaseUrl((
            process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`
        )).replace(/\/$/, "");

        const check = () => {
            fetch(`${apiBase}/${API_ROUTES.USER.HEALTH}`, { method: "GET" })
                .then(() => setIsBackendUp(true))
                .catch(() => setIsBackendUp(false))
                .finally(() => setChecked(true));
        };

        check();
        const interval = setInterval(check, HEALTH_CHECK_INTERVAL_MS);
        return () => clearInterval(interval);
    }, []);

    const value = useMemo(
        () => ({ isBackendUp, checked }),
        [checked, isBackendUp]
    );

    return (
        <BackendStatusContext.Provider value={value}>
            {children}
        </BackendStatusContext.Provider>
    );
}

export function useBackendStatus() {
    return useContext(BackendStatusContext);
}
